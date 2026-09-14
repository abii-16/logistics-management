import sys
from supabase import create_client, Client
from settings import settings

if not settings.supabase_url or not settings.supabase_service_role_key:
    print("WARNING: supabase_url or supabase_service_role_key is missing in settings.", file=sys.stderr)
    supabase_client: Client = None
else:
    supabase_client: Client = create_client(settings.supabase_url, settings.supabase_service_role_key)
