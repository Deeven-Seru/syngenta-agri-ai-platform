// vectorize.js - Run via mongosh
// Aggregates data and prepares chunks for vectorization

const dbName = 'syngenta_agri';
const db = db.getSiblingDB(dbName);

print('🌱 Starting In-Cluster Data Preparation...');

// 1. Clear existing chunks
db.knowledge_vectors.deleteMany({ 'metadata.source': 'in-cluster-script' });

// 2. Prepare Retailer/Inventory Chunks
print('🏪 Processing Retailer Inventory...');
db.retailer_inventory.aggregate([
    { $match: { week_end_date: "2026-03-29" } },
    {
        $lookup: {
            from: "retailers",
            localField: "retailer_id",
            foreignField: "_id",
            as: "retailer_info"
        }
    },
    { $unwind: "$retailer_info" },
    {
        $project: {
            text_content: {
                $concat: [
                    "Retailer ", "$retailer_id", " in ", "$retailer_info.tehsil", ", ", 
                    "$retailer_info.district", " has ", { $toString: "$qty" }, " units of ", "$sku_name", " in stock."
                ]
            },
            metadata: {
                type: "inventory",
                retailer_id: "$retailer_id",
                product_name: "$sku_name",
                district: "$retailer_info.district",
                state: "$retailer_info.state",
                source: "in-cluster-script"
            }
        }
    }
]).forEach(chunk => {
    db.knowledge_vectors.insertOne(chunk);
});

// 3. Prepare Rep Chunks
print('👔 Processing Representative Territories...');
db.reps_territory.aggregate([
    {
        $project: {
            text_content: {
                $concat: [
                    "The Syngenta representative for ", "$district", ", ", "$state", 
                    " is Rep ", "$_id", "."
                ]
            },
            metadata: {
                type: "rep",
                rep_id: "$_id",
                district: "$district",
                state: "$state",
                source: "in-cluster-script"
            }
        }
    }
]).forEach(chunk => {
    db.knowledge_vectors.insertOne(chunk);
});

print('✅ Data Preparation Complete. Documents are ready in knowledge_vectors (awaiting embeddings).');
