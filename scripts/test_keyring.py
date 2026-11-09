import keyring

pwd = keyring.get_password('pgAdmin4', 'pgadmin4-master-password')
print("Keyring pgadmin4-master-password:", pwd)

for svc in ['pgAdmin4', 'pgadmin4', 'pgAdmin']:
    for user in ['pgadmin4-master-password', 'pgadmin4@pgadmin.org', 'postgres']:
        p = keyring.get_password(svc, user)
        if p:
            print(f"Found keyring [{svc} / {user}]: {p}")
