//Import AWS
let AWS = require("aws-sdk");

//Set region
AWS.config.update({ region: 'us-east-1' });

//AWS class that will query endpoint
let awsRuntime = new AWS.SageMakerRuntime({});

// importing cors library to avoid CORS-Policy violation
const cors = require('cors');

const bodyParser = require('body-parser');

//Import date functions
// import { addDays, format } from "date-fns";
const { addDays, format } = require('date-fns');

const express = require('express');

const axios = require('axios');

const app = express();

const port = 3000;

// using cors
app.use(cors());

app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.post('/predict', (req, res) => {
    const newNumericData = req.body.newNumericData;
    const selectedCurrency = req.body.selectedCurrency;
    //Get last 100 items
    const last100Items = newNumericData.target.slice(newNumericData.target.length - 100, newNumericData.target.length);

    //Advance start date to start of data (IMPORTANT!!! addHours is used because the data is hourly, you need to use addDay)
    const newDate = addDays(new Date(newNumericData.start), newNumericData.target.length - 100);
    const newTimestamp = format(newDate, "yyyy-MM-dd hh:mm:ss");

    let endpointData = {
        "instances": [
            {
                "start": newTimestamp,
                "target": last100Items
            }
        ],
        "configuration": {
            "num_samples": 50,
            "output_types": ["mean", "quantiles", "samples"],
            "quantiles": ["0.1", "0.9"]
        }
    };

    let smParams = {
        EndpointName: selectedCurrency + "Endpoint",
        Body: JSON.stringify(endpointData),
        ContentType: "application/json",
        Accept: "application/json"
    };

    awsRuntime.invokeEndpoint(smParams, (err, data) => {
        if (err) {//An error occurred
            console.log(err, err.stack);

            //Return error response
            const response = {
                statusCode: 500,
                body: JSON.stringify('ERROR: ' + JSON.stringify(err)),
            };
            // return response;
            res.send(response);
        }
        else {//Successful response
            //Convert response data to JSON
            let responseData = JSON.parse(Buffer.from(data.Body).toString('utf8'));
            // console.log(JSON.stringify(responseData));

            //Return successful response
            const response = {
                statusCode: 200,
                body: JSON.stringify(responseData.predictions[0].mean),
            };
            // return response;
            res.send(response);
        }
    });
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
