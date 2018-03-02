const express = require('express');
const app = express();
const routes = require('./routes/routes')

let allowCrossDomain = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}
app.use(allowCrossDomain);

// API routes
app.use('/api', routes);

app.listen(3000, () => console.log('Guides server started...'))