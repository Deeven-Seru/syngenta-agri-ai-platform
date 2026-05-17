from supertokens_python import init, InputAppInfo, SupertokensConfig
from supertokens_python.recipe import (
    emailpassword,
    session,
    userroles,
    jwt
)

from config import get_settings

settings = get_settings()


def init_supertokens():
    init(
        app_info=InputAppInfo(
            app_name=settings.app_name,
            api_domain=settings.api_domain,
            website_domain=settings.website_domain,
            api_base_path=settings.api_base_path,
            website_base_path=settings.website_base_path
        ),

        supertokens_config=SupertokensConfig(
            connection_uri=settings.supertokens_connection_uri,
            api_key=settings.supertokens_api_key,
        ),

        framework='fastapi',

        recipe_list=[
            session.init(
                cookie_secure=False,
                session_expired_status_code=401
            ),

            emailpassword.init(),

            userroles.init(),

            jwt.init(),
        ],

        mode='asgi'
    )


def get_role_definitions():
    return {
        "Marketing Admin": [
            "create:campaigns",
            "edit:content",
            "view:analytics"
        ],

        "Field Officer": [
            "view:analytics",
            "view:growers"
        ],

        "System Auditor": [
            "view:health"
        ]
    }