import 'babel-polyfill';
import fs from 'fs';
import promisify from 'util.promisify';
import fetch from 'node-fetch';
import deepEqual from 'deep-equal';

import { checkStatus, parseJSON } from "./request.utils";

const databaseURL = 'https://bekk-lab.firebaseio.com';
const printerAddress = '10.0.50.71';
const apiLocation = `http://${printerAddress}/api/v1`;
const localDataPath = './data';
const responseFile = `${localDataPath}/threeDeePrinterResponse`;

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const request = async (path: string) => {
  const requestStackTrace = new Error().stack;
  return fetch(`${apiLocation}${path}`)
    .then(checkStatus(requestStackTrace))
    .then(parseJSON);
};

const get3DPrinterStatus = async () => {
  try {
    return await request('/printer/status');
  } catch (err) {
    console.log("Status fetch failed");
    return 'unknown';
  }
};

const get3DPrinterJob = async () => {
  try {
    return await request('/print_job');
  } catch (err) {
    console.log("Job fetch failed");
    return {};
  }
};

const loadPreviousResponseFromFile = async () => {
  try {
    const contents = await readFile(responseFile, 'utf8');
    return JSON.parse(contents);
  } catch (err){
    return {};
  }
};

const writeResponseToFile = async (response) => {
  const content = JSON.stringify(response);
  await writeFile(responseFile, content);
};

const hasResponseChanged = (newResponse, oldResponse) => deepEqual(newResponse, oldResponse) === false;

const writeStatusToFirebase = async (response) => {
  await fetch(databaseURL + '/3dprint/status.json', { method: 'PATCH', body: JSON.stringify(response) })
    .then(res => res.json())
    .then(json => console.log(json));
};


const poll = async () => {

  const treeDeePrinterResponse = {
    status: await get3DPrinterStatus(),
    job: await get3DPrinterJob(),
  };

  const previousResponse = await loadPreviousResponseFromFile();
  if (hasResponseChanged(treeDeePrinterResponse, previousResponse)) {
    console.log('response has changed');
    try {
      await writeStatusToFirebase(treeDeePrinterResponse);
      console.log('wrote status to firebase');
    } catch (err) {
      console.log('3dprinter status update failed while writing to firebase');
    }
    await writeResponseToFile(treeDeePrinterResponse);
  } else {
    console.log('response is unchanged');
  }
};

// TODO: Save ip address of pi as well

poll();