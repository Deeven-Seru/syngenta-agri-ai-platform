import { useState } from 'react';
import { api } from '../api';
import { IconCheck, IconPlus, IconAlertTriangle } from '../icons';

export default function RegisterGrower() {
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('Uttar Pradesh');
  const [district, setDistrict] = useState('Agra');
  const [tehsil, setTehsil] = useState('');
  const [language, setLanguage] = useState('Hindi');
  const [deviceType, setDeviceType] = useState('smartphone');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState('male');
  const [crop, setCrop] = useState('wheat');
  const [stage, setStage] = useState('sowing');
  const [farmSize, setFarmSize] = useState<number | ''>('');
  const [offlineAttended, setOfflineAttended] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState('');
  const [productName, setProductName] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      setError('Phone number is required.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    const payload = {
      phone: phone.trim(),
      state: state.trim(),
      district: district.trim(),
      tehsil: tehsil.trim() || `${district}_T${Math.floor(Math.random() * 200 + 100)}`,
      language,
      device_type: deviceType,
      grower_age: age ? Number(age) : null,
      gender,
      primary_crop: crop,
      current_stage: stage,
      farm_size_acres: farmSize ? Number(farmSize) : null,
      offline_campaign_attended: offlineAttended,
      campaign_attendance_date: offlineAttended ? (attendanceDate || new Date().toISOString().split('T')[0]) : '',
      product_name: productName.trim(),
    };

    api.createGrower(payload)
      .then((data) => {
        setSuccess(data);
        setPhone('');
        setTehsil('');
        setAge('');
        setFarmSize('');
        setOfflineAttended(false);
        setAttendanceDate('');
        setProductName('');
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to register grower.');
        setLoading(false);
      });
  };

  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <h1 className="page-title">Register Grower</h1>
          <p className="page-sub">Add a new farmer profile to the Syngenta marketing database</p>
        </div>
      </div>
      <div className="page-body" style={{ maxWidth: 800 }}>
        {success && (
          <div className="card mb-4" style={{ borderColor: 'var(--green)', background: 'rgba(0, 255, 102, 0.03)' }}>
            <div className="card-head" style={{ borderBottom: 'none', padding: '16px 20px' }}>
              <div className="card-label" style={{ color: 'var(--green-hi)' }}>
                <IconCheck size={18} />
                Grower Registered Successfully
              </div>
            </div>
            <div style={{ padding: '0 20px 20px', color: 'var(--text-2)' }}>
              Successfully created profile for grower with ID/Phone <strong>{success.grower_id}</strong> in {success.district}, {success.state}.
            </div>
          </div>
        )}

        {error && (
          <div className="card mb-4" style={{ borderColor: 'var(--red)', background: 'rgba(255, 51, 51, 0.03)' }}>
            <div className="card-head" style={{ borderBottom: 'none', padding: '16px 20px' }}>
              <div className="card-label" style={{ color: 'var(--red-hi)' }}>
                <IconAlertTriangle size={18} />
                Registration Error
              </div>
            </div>
            <div style={{ padding: '0 20px 20px', color: 'var(--text-2)' }}>
              {error}
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-head">
            <div className="card-label">
              <IconPlus size={16} />
              New Grower Profile Form
            </div>
          </div>
          <form onSubmit={handleSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Phone Number / Identifier</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 919876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Primary Crop</label>
                <select className="form-select" value={crop} onChange={(e) => setCrop(e.target.value)}>
                  <option value="wheat">Wheat</option>
                  <option value="rice">Rice</option>
                  <option value="cotton">Cotton</option>
                  <option value="maize">Maize</option>
                  <option value="sugarcane">Sugarcane</option>
                  <option value="soybean">Soybean</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Vegetative Stage</label>
                <select className="form-select" value={stage} onChange={(e) => setStage(e.target.value)}>
                  <option value="sowing">Sowing</option>
                  <option value="tillering">Tillering</option>
                  <option value="flowering">Flowering</option>
                  <option value="vegetative">Vegetative Growth</option>
                  <option value="harvesting">Harvesting</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Preferred Language</label>
                <select className="form-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
                  <option value="Hindi">Hindi</option>
                  <option value="Marathi">Marathi</option>
                  <option value="Punjabi">Punjabi</option>
                  <option value="Gujarati">Gujarati</option>
                  <option value="Kannada">Kannada</option>
                  <option value="Bengali">Bengali</option>
                  <option value="Telugu">Telugu</option>
                  <option value="Tamil">Tamil</option>
                  <option value="English">English</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">State</label>
                <input
                  type="text"
                  className="form-input"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">District</label>
                <input
                  type="text"
                  className="form-input"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Tehsil (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Agra_T108"
                  value={tehsil}
                  onChange={(e) => setTehsil(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Farm Size (Acres)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="e.g. 2.5"
                  value={farmSize}
                  onChange={(e) => setFarmSize(e.target.value ? parseFloat(e.target.value) : '')}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Device Type</label>
                <select className="form-select" value={deviceType} onChange={(e) => setDeviceType(e.target.value)}>
                  <option value="smartphone">Smartphone</option>
                  <option value="keypad">Basic Keypad Phone</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select className="form-select" value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Age (Years)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 45"
                  value={age}
                  onChange={(e) => setAge(e.target.value ? parseInt(e.target.value) : '')}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Product Ingestion</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Amistar (last scanned product)"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                />
              </div>
            </div>

            <div className="divider" />

            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                id="offline-campaign"
                style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }}
                checked={offlineAttended}
                onChange={(e) => setOfflineAttended(e.target.checked)}
              />
              <label htmlFor="offline-campaign" className="form-label" style={{ cursor: 'pointer', textTransform: 'none', fontSize: 13, color: 'var(--text-1)' }}>
                Farmer has attended an offline Syngenta community campaign
              </label>
            </div>

            {offlineAttended && (
              <div className="form-group">
                <label className="form-label">Attendance Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <div className="spinner" />
                    Registering...
                  </>
                ) : (
                  <>
                    <IconPlus size={14} />
                    Register Grower
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
