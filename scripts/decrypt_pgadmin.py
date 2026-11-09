import base64
import os
import sqlite3
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.ciphers import Cipher
from cryptography.hazmat.primitives.ciphers.algorithms import AES
from cryptography.hazmat.decrepit.ciphers.modes import CFB8

padding_string = b'}'
iv_size = AES.block_size // 8

def pad(key):
    if isinstance(key, str):
        key = key.encode()
    key = key[:32]
    if len(key) in (16, 24, 32):
        return key
    return key.ljust(32, padding_string)

def decrypt(ciphertext, key):
    ciphertext = base64.b64decode(ciphertext)
    iv = ciphertext[:iv_size]
    cipher = Cipher(AES(pad(key)), CFB8(iv), default_backend())
    decryptor = cipher.decryptor()
    return decryptor.update(ciphertext[iv_size:]) + decryptor.finalize()

db_path = os.path.join(os.environ['APPDATA'], 'pgadmin', 'pgadmin4.db')
conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("SELECT password FROM server WHERE id=1")
server_pwd_hex = c.fetchone()[0]
server_pwd_b64 = bytes.fromhex(server_pwd_hex).decode('utf-8')

candidates = [
    'Hoang2005@',
    'Hoang@2005',
    'hoang@2005',
    'hoang2005@',
    'Hoang2005!',
    'hoang2005!',
    'Hoang2005#',
    'hoang2005#',
    'Hoang2005$',
    'Hoang2005',
    'hoang2005',
    'Hoang@123',
    'Hoang123@',
    'Hoang123',
    'hoang123',
    'Hoang@123456',
    'Hoang',
    'hoang',
    'asus',
    'Asus',
    'admin',
    'Admin',
    'postgres',
    'Postgres',
    '123456',
    '12345678',
    'root',
    'password'
]

for pwd in candidates:
    try:
        res = decrypt(server_pwd_b64, pwd)
        decoded = res.decode('utf-8')
        # Check if printable ascii
        if all(32 <= ord(ch) <= 126 for ch in decoded):
            print(f">>> FOUND! Master key: '{pwd}' => Server Password: '{decoded}'")
            break
    except Exception:
        pass
else:
    print("No valid printable password found with candidates as master key.")
