const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const port = process.env.PORT || 5000;
require('dotenv').config()

// Middleware
const app = express();
app.use(cors());
app.use(express.json());

// Database
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.be9iv.mongodb.net/${process.env.DATABASE}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();

        const database = client.db('tourist_places');
        const destinationCollection = database.collection('destinations');
        const orderCollection = database.collection('orders');

        // GET destination from database API
        app.get('/destinations', async (req, res) => {
            const cursor = destinationCollection.find({});
            const destinations = await cursor.toArray();
            res.json(destinations);
        })

        // GET single destination details by ID
        app.get('/booking/:locationId', async (req, res) => {

            const id = req.params.locationId;
            const query = { _id: ObjectId(id) }
            const options = {
                projection: { _id: 0 },
            };

            const result = await destinationCollection.findOne(query, options);
            res.json(result);
        })

        // POST order in database
        app.post('/placeorder', async (req, res) => {

            const order = req.body;
            order.status = 'Pending';

            const result = await orderCollection.insertOne(order);
            res.send(result);
        })

        // GET orders from database
        app.get('/myorders/:email', async (req, res) => {
            const query = { email: req.params.email };

            const result = await orderCollection.find(query).toArray();

            res.json(result);
        })

        // Confirmation
        app.put('/confirm/:orderId', async (req, res) => {
            const orderId = req.params.orderId;
            const order = await orderCollection.findOne({ _id: ObjectId(orderId) })

            const filter = { _id: ObjectId(orderId) };

            const updateDoc = {
                $set: {
                    status: order.status = 'Confirmed'
                },
            };

            const result = await orderCollection.updateOne(filter, updateDoc);

            res.json(result)
        })

    }
    finally {
        // await client.close() 
    }
}
run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('Make my Trip server running.')
})

app.listen(port, () => {
    console.log('Server running at port', port);
})