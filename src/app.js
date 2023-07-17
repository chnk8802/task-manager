const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('./db/mongoose');
// require('./db/mongoose')();
const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');

// start Express server
const app = express();
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:5173", credentials: true}));
// To parse the incoming json data from POST request
app.use(express.json());
// Using Routes
app.use(userRouter);
app.use(taskRouter);

module.exports = app