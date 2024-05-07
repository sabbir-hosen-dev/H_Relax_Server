const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const PORT = 5050;

const app = express();

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

require('dotenv').config()

const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = `mongodb+srv://${process.env.DB_USER_NAME}:${process.env.DB_PASS}@cluster0.02y3257.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const admin = require("firebase-admin");

var serviceAccount = require("./config/h-realax-firebase-adminsdk-iq9ac-5affb14f65.json");
const { getAuth } = require("firebase-admin/auth");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function run() {
  try {
    await client.connect();
    console.log("Connectted To MOngodb");

    const collaction = client.db(process.env.DB_NAME).collection(process.env.DB_COLLACTION);

    app.get("/bookdin", async (req, res) => {
      const email = req.query.email;
      const bearer = req.headers.authorization;
    
      if (bearer && bearer.startsWith("Bearer ")) {
        const idToken = bearer.split(" ")[1];
        try {
          const decodedToken = await getAuth().verifyIdToken(idToken);
          const tokenEmail = decodedToken.email;
          if (email === tokenEmail) {
            const data = await collaction.find({ userEmail: email }).toArray();
            res.send(data);
          } else {
            res.status(403).send("Unauthorized");
          }
        } catch (error) {
          console.error("Error verifying token:", error);
          res.status(500).send("Internal Server Error");
        }
      } else {
        res.status(401).send("Unauthorized");
      }
    });
    

    //post data mongodb
    app.post("/addData", async (req, res) => {
      try {
        const data = req.body;
        const result = await collaction.insertOne(data);
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });

    app.get("/", (req, res) => {
      res.send("hellow iam server");
    });

    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}

run().catch(console.dir);
