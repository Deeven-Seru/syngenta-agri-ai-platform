import asyncio
from auth import init_supertokens, get_role_definitions
from supertokens_python.recipe.userroles.asyncio import create_new_role_or_add_permissions
from supertokens_python.recipe.userroles.interfaces import CreateNewRoleOrAddPermissionsOkResult

async def setup():
    init_supertokens()
    roles = get_role_definitions()
    for role, permissions in roles.items():
        res = await create_new_role_or_add_permissions(role, permissions)
        if isinstance(res, CreateNewRoleOrAddPermissionsOkResult):
            print(f"[OK] Role '{role}' -> {permissions}")
        else:
            print(f"[FAIL] Role '{role}'")

if __name__ == "__main__":
    asyncio.run(setup())
