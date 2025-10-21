📘 PHP GraphQL Learning API
-- API domain https://apis.aznetviet.xyz
A PHP backend API using GraphQL for managing users, books, reading progress, and English–Vietnamese sentences with audio pronunciation.

🚀 Overview

Entrypoint: index.php — POST { query, variables }

Upload (MP3): upload-pronunciation.php — multipart/form-data file

Auth: JWT via App\Utils\JWTHelper, use Authorization: Bearer <token>

DB: MySQL via App\Config\Database (PDO, .env config)

🧩 Schema

Tables:

users(id, username, email, password_hash, full_name, ...)

books(id, title, author, ...)

book_pages(id, book_id, page_number, audio_url, duration)

user_progress(id, user_id, book_id, current_page, completed)

sentences(id, english, vietnamese, audio_url)

🔐 Auth Flow

Register: register(input: RegisterInput!) → AuthPayload

Login: login(username, password) → AuthPayload

me: Get current user via token

Password hashed via password_hash, verified via password_verify

🧠 GraphQL Types

User, Book, BookPage, UserProgress, Sentence, AuthPayload
Inputs: RegisterInput, UpdateUserInput, CreateBookPageInput, CreateSentenceInput

🧰 Key Queries / Mutations
# Register
mutation($input: RegisterInput!){
  register(input:$input){ token user{ id username email fullName } }
}

# Login
mutation($u:String!,$p:String!){
  login(username:$u,password:$p){ token user{ id username } }
}

# Me
query{ me{ id username email fullName } }

# Create Sentence
mutation($i:CreateSentenceInput!){
  createSentence(input:$i){ id english vietnamese audioUrl }
}

🎧 File Upload
# cURL
curl -X POST https://example.com/upload-pronunciation.php \
 -F "file=@/path/to/file.mp3" \
 -H "X-Upload-Token: my-upload-token"


Response:
{ "ok": true, "url": "https://.../uploads/pronunciations/abcd.mp3" }

🧩 Example Flow

Register/Login → store token

Upload MP3 → get audioUrl

Use createSentence or createBookPage mutation with that URL

⚙️ Notes

JWT secret: JWT_SECRET, expires in 24h

Upload limit: 5 MB (MP3 only)

Auth-required queries → use Bearer token

Env: DB_*, JWT_SECRET, UPLOAD_TOKEN

✅ Quick Fetch Example
fetch('/index.php',{
 method:'POST',
 headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
 body:JSON.stringify({query:'{ me { id username email } }'})
}).then(r=>r.json()).then(console.log)