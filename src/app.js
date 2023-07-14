const express = require('express');
const cors = require('cors')
require('./db/mongoose');
// require('./db/mongoose')();
const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');

// start Express server
const app = express();
app.use(cors());
// To parse the incoming json data from POST request
app.use(express.json());
// Using Routes
app.use(userRouter);
app.use(taskRouter);

module.exports = app