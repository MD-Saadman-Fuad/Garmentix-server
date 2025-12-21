const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const stripe = require('stripe')(process.env.STRIPE_SECRET);

// Firebase Admin SDK (if you're using Firebase)
const admin = require('firebase-admin');
admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
});

function generateTrackingId() {
    const prefix = "PRCL"; // your brand prefix
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
    const random = crypto.randomBytes(3).toString("hex").toUpperCase(); // 6-char random hex

    return `${prefix}-${date}-${random}`;
}

const verifyFBToken = async (req, res, next) => {
    // Check Authorization header first, then cookie
    let token = req.headers.authorization;

    if (!token) {
        token = req.cookies.firebaseToken;
    } else {
        token = token.split(' ')[1]; // Extract from "Bearer token"
    }

    if (!token) {
        return res.status(401).send({ message: 'Unauthorized access' });
    }

    try {
        const decoded = await admin.auth().verifyIdToken(token);
        req.decodedEmail = decoded.email;
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).send({ message: 'Unauthorized access' });
    }
};

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));


const uri = `${process.env.URI}`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const db = client.db("garmentixDB");
        const productsCollection = db.collection("products");
        const ordersCollection = db.collection("orders");
        const usersCollection = db.collection("users");
        const paymentCollection = db.collection("payments");

        //products APIs
        app.post('/products', async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.send(result);
        });
        app.get('/products', async (req, res) => {
            const email = req.query.email;
            let query = {};
            if (email) {
                query = { email: email };
            }

            const cursor = productsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

        app.get('/products/featured', async (req, res) => {
            // console.log('hit featured');
            const cursor = productsCollection.find({ showOnHome: true }).limit(6);
            const result = await cursor.toArray();
            res.send(result);
        });

        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;

            // Validate ObjectId format
            if (!ObjectId.isValid(id)) {
                return res.status(400).send({ error: 'Invalid product ID format' });
            }

            const query = { _id: new ObjectId(id) };
            const product = await productsCollection.findOne(query);

            if (!product) {
                return res.status(404).send({ error: 'Product not found' });
            }

            res.send(product);
        });



        app.put('/products/:id', async (req, res) => {
            const id = req.params.id;
            const product = req.body;

            // Validate ObjectId format
            if (!ObjectId.isValid(id)) {
                return res.status(400).send({ error: 'Invalid product ID format' });
            }

            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = { $set: product };
            const result = await productsCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        });
        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;

            // Validate ObjectId format
            if (!ObjectId.isValid(id)) {
                return res.status(400).send({ error: 'Invalid product ID format' });
            }

            const query = { _id: new ObjectId(id) };
            const result = await productsCollection.deleteOne(query);
            res.send(result);
        });

        //orders

        app.post('/orders', async (req, res) => {
            const order = req.body;
            const result = await ordersCollection.insertOne(order);
            res.send(result);
        });

        app.get('/orders', async (req, res) => {
            console.log('hit');
            const email = req.query.email;
            const status = req.query.status;
            let query = {};
            if (email) {
                query = { email: email };
            }
            if (status) {
                query.status = status;
            }
            const cursor = ordersCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

        app.patch('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const status = req.body.status;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: { status: status },
            };
            const result = await ordersCollection.updateOne(filter, updateDoc);
            res.send(result);
        });

        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await ordersCollection.deleteOne(query);
            res.send(result);
        });

        //users

        app.post('/users', async (req, res) => {
            const user = req.body;
            const exists = await usersCollection.findOne({ email: user.email });
            if (exists) {
                return res.send({ message: 'User already exists' });
            }
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        app.get('/users', async (req, res) => {
            const cursor = usersCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            res.send(user);
        });

        app.put('/users/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        });

        app.delete('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await usersCollection.deleteOne(query);
            res.send(result);
        });

        // Auth Routes - Store Firebase token in cookie
        app.post('/auth/login', async (req, res) => {
            try {
                const { idToken } = req.body;

                if (!idToken) {
                    return res.status(400).send({ message: 'Firebase token required' });
                }

                // Verify Firebase token
                const decodedToken = await admin.auth().verifyIdToken(idToken);

                // Set Firebase token in httpOnly cookie
                res.cookie('firebaseToken', idToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
                });

                res.send({
                    success: true,
                    message: 'Login successful',
                    user: {
                        email: decodedToken.email,
                        uid: decodedToken.uid
                    }
                });
            } catch (error) {
                console.error('Login error:', error);
                res.status(401).send({ message: 'Invalid Firebase token' });
            }
        });

        app.get('/auth/verify', async (req, res) => {
            try {
                // Check Authorization header first, then cookie
                let token = req.headers.authorization;

                if (!token) {
                    token = req.cookies.firebaseToken;
                } else {
                    token = token.split(' ')[1]; // Extract from "Bearer token"
                }

                if (!token) {
                    return res.status(401).send({ authenticated: false });
                }

                // Verify Firebase token
                const decodedToken = await admin.auth().verifyIdToken(token);

                res.send({
                    authenticated: true,
                    user: {
                        email: decodedToken.email,
                        uid: decodedToken.uid
                    }
                });
            } catch (error) {
                console.error('Token verification error:', error);
                res.status(401).send({ authenticated: false });
            }
        });

        app.post('/auth/logout', (req, res) => {
            res.clearCookie('firebaseToken', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            });
            res.send({ success: true });
        });

        //Payment Related API

        app.post('/create-checkout-session', async (req, res) => {
            const paymentInfo = req.body;
            const amount = parseInt(paymentInfo.cost) * 100; // Convert to cents
            const session = await stripe.checkout.sessions.create({
                line_items: [
                    {
                        price_data: {
                            currency: 'USD',
                            unit_amount: amount,
                            product_data: {
                                name: paymentInfo.parcelName,
                            }
                        },

                        quantity: 1,
                    },
                ],
                customer_email: paymentInfo.senderEmail,
                mode: 'payment',
                metadata: {
                    parcelId: paymentInfo.parcelId,
                    parcelName: paymentInfo.parcelName,
                },
                success_url: `${process.env.SITE_DOMAIN}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.SITE_DOMAIN}/dashboard/payment-cancelled`,
            });

            // res.redirect(303, session.url);
            console.log(session.url);
            res.send({ url: session.url });
        });

        app.patch('/payment-success', async (req, res) => {
            const sessionId = req.query.session_id;
            // console.log(sessionId);
            const session = await stripe.checkout.sessions.retrieve(sessionId);

            const transactionId = session.payment_intent;
            // console.log('retrives', session);
            const trackingId = generateTrackingId();

            const paymentexists = await paymentCollection.findOne({ transactionId: transactionId });
            if (paymentexists) {
                return res.send({ success: true, message: 'Payment already recorded', trackingId: paymentexists.trackingId, transactionId: transactionId, paymentInfo: paymentexists });
            }

            if (session.payment_status === 'paid') {
                const id = session.metadata.parcelId;
                const query = { _id: new ObjectId(id) };

                const update = {
                    $set: {
                        paymentStatus: 'paid',
                        trackingId: trackingId,
                    }
                }
                const result = await ordersCollection.updateOne(query, update);

                const payment = {
                    amount: session.amount_total / 100,
                    currency: session.currency,
                    customerEmail: session.customer_email,
                    parcelId: session.metadata.parcelId,
                    parcelName: session.metadata.parcelName,
                    transactionId: session.payment_intent,
                    paymentStatus: session.payment_status,
                    paidAt: new Date(),
                    trackingId: trackingId,

                }

                if (session.payment_status === 'paid') {
                    const resultpayment = await paymentCollection.insertOne(payment);
                    res.send({
                        success: true,
                        modifiedparcel: result,
                        trackingId: trackingId,
                        transactionId: session.payment_intent,
                        paymentInfo: resultpayment
                    });
                }

                // return res.send(result);
            }
            res.send({ success: false });
        })

        app.get('/payments', verifyFBToken, async (req, res) => {
            // console.log('query hit');
            const email = req.query.email;
            // console.log(email);
            const query = { customerEmail: email };
            const options = { sort: { paidAt: -1 } };
            if (email) {
                query.customerEmail = email;

                if (req.decodedEmail !== email) {
                    return res.status(403).send({ message: 'Forbidden access' });
                }
            }
            const cursor = paymentCollection.find(query, options).sort({ paidAt: -1 });
            const payments = await cursor.toArray();
            res.send(payments);
        });









        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Garmentix is Shifting!');
});


app.listen(port, () => {
    console.log(`Garmentix is running on port ${port}`);
});