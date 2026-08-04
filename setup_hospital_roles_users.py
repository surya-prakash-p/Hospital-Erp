import urllib.request
import urllib.parse
import json

API_KEY = "802a7dc89ec8034"
API_SECRET = "edd331225cf6ca1"
SITE_URL = "https://thangamhospital.m.frappe.cloud"

headers = {
    "Authorization": f"token {API_KEY}:{API_SECRET}",
    "Content-Type": "application/json",
    "Accept": "application/json"
}

def make_request(method, endpoint, data=None):
    parts = endpoint.split('/')
    quoted_parts = [urllib.parse.quote(p) if p else '' for p in parts]
    url = f"{SITE_URL}{'/'.join(quoted_parts)}"
    
    req = urllib.request.Request(url, headers=headers, method=method)
    if data:
        req.data = json.dumps(data).encode("utf-8")
    try:
        with urllib.request.urlopen(req) as response:
            res_data = response.read().decode("utf-8")
            return json.loads(res_data) if res_data else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        if e.code == 409 or "already exists" in err_body.lower():
            print(f"Object already exists for {endpoint}, skipping.")
            return {}
        print(f"HTTP Error {e.code} for {method} {url}: {err_body}")
        return {}
    except Exception as e:
        print(f"Error connecting to {url}: {e}")
        return {}

def create_role_if_not_exists(role_name):
    try:
        res = make_request("GET", f"/api/resource/Role/{role_name}")
        if res.get("data"):
            print(f"Role '{role_name}' already exists.")
            return
    except Exception:
        pass

    role_doc = {
        "doctype": "Role",
        "role_name": role_name,
        "desk_access": 1
    }
    make_request("POST", "/api/resource/Role", role_doc)
    print(f"Created Role: {role_name}")

def create_or_update_user(email, mobile, first_name, last_name, role_name, password):
    user_data = {
        "doctype": "User",
        "email": email,
        "first_name": first_name,
        "last_name": last_name,
        "mobile_no": mobile,
        "phone": mobile,
        "enabled": 1,
        "send_welcome_email": 0,
        "user_type": "System User",
        "roles": [{"role": role_name}, {"role": "System Manager"}] if role_name == "Hospital Admin" else [{"role": role_name}]
    }

    user_res = make_request("GET", f"/api/resource/User/{email}")
    if user_res.get("data"):
        print(f"User {email} exists, updating roles and mobile...")
        update_data = {
            "mobile_no": mobile,
            "phone": mobile,
            "roles": [{"role": role_name}]
        }
        make_request("PUT", f"/api/resource/User/{email}", update_data)
    else:
        print(f"Creating user {email}...")
        make_request("POST", "/api/resource/User", user_data)

    pwd_payload = {
        "user": email,
        "new_password": password
    }
    make_request("POST", "/api/method/frappe.core.doctype.user.user.reset_password", pwd_payload)
    print(f"Set password for {email} ({mobile}) -> {role_name}")

print("=== Setting up Hospital Roles & Users on Frappe Cloud ===")

roles = [
    "Hospital Admin",
    "Doctor",
    "Pharmacist",
    "Lab Technician",
    "Receptionist",
    "Billing Clerk"
]

for r in roles:
    create_role_if_not_exists(r)

demo_users = [
    {
        "email": "admin@thangamhospital.com",
        "mobile": "9900000001",
        "first_name": "Hospital",
        "last_name": "Admin",
        "role": "Hospital Admin",
        "password": "AdminPassword123!"
    },
    {
        "email": "doctor@thangamhospital.com",
        "mobile": "9900000002",
        "first_name": "Dr. Rajesh",
        "last_name": "Kumar",
        "role": "Doctor",
        "password": "DoctorPassword123!"
    },
    {
        "email": "pharmacy@thangamhospital.com",
        "mobile": "9900000003",
        "first_name": "Rahul",
        "last_name": "Sharma",
        "role": "Pharmacist",
        "password": "PharmaPassword123!"
    },
    {
        "email": "reception@thangamhospital.com",
        "mobile": "9900000004",
        "first_name": "Priya",
        "last_name": "Sundaram",
        "role": "Receptionist",
        "password": "ReceptPassword123!"
    }
]

for user in demo_users:
    create_or_update_user(
        email=user["email"],
        mobile=user["mobile"],
        first_name=user["first_name"],
        last_name=user["last_name"],
        role_name=user["role"],
        password=user["password"]
    )

print("=== Setup Completed Successfully ===")
