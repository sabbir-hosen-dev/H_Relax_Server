const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const PORT = 5050;

const app = express();

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

require("dotenv").config();

const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = `mongodb+srv://h-relax:${process.env.DB_PASS}@cluster0.02y3257.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const admin = require("firebase-admin");

const { getAuth } = require("firebase-admin/auth");

admin.initializeApp({
  credential: admin.credential.cert(
    require("./config/h-realax-firebase-adminsdk-iq9ac-e4b369cf41.json")
  ),
});

async function run() {
  try {
    await client.connect();
    console.log("Connectted To MOngodb");

    const collaction = client
      .db(process.env.DB_NAME)
      .collection(process.env.DB_COLLECTION);

    app.get("/getData", async (req, res) => {
      try {
        const data = await collaction
          .find({ userEmail: "tssabbirhosen@gmail.com" })
          .toArray();
        res.send(data);
      } catch (error) {
        console.log(error);
      }
    });

    app.get("/bookdin", async (req, res) => {
      const email = req.query.email;
      const bearer = req.headers.authorization;

      if (bearer && bearer.startsWith("Bearer ")) {
        console.log("brr get");
        const idToken = bearer.split(" ")[1];
        try {
          const decodedToken = await getAuth().verifyIdToken(idToken);
          const tokenEmail = decodedToken.email;
          if (email === tokenEmail) {
            console.log("email get");
            const data = await collaction.find({ userEmail: email }).toArray();
            res.send(data);
          } else {
            console.log("data not");
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
        console.log(req.body);
        const result = await collaction.insertOne(data);
        res.send(result);
      } catch (err) {
        console.log(err);
      }
    });

    app.get("/", async (req, res) => {
      res.send("server is running");
    });

    app.listen(PORT, () => {
      console.log(
        `${process.env.FIRE_BASE_ADIMN} Server is running at http://localhost:${PORT}`
      );
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}

run().catch(console.dir);
