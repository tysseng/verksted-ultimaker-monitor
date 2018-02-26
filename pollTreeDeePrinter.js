import 'babel-polyfill';
import fs from 'fs';
import util from 'util';
import firebase from 'firebase';
import fetch from 'node-fetch';
import deepEqual from 'deep-equal';

import { checkStatus, parseJSON } from "./request.utils";

const printerAddress = '10.0.50.35';
const apiLocation = `http://${printerAddress}/api/v1`;
const localDataPath = './data';
const responseFile = `${localDataPath}/threeDeePrinterResponse`;

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const app = firebase.initializeApp({
  databaseURL: 'https://bekk-lab.firebaseio.com',
});


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
  if(fs.existsSync(responseFile)){
    const contents = await readFile();
    return JSON.parse(contents);
  } else {
    return {};
  }
};

const writeResponseToFile = async (response) => {
  const content = JSON.stringify(response);
  await writeFile(responseFile, content);
};

const hasResponseChanged = (newResponse, oldResponse) => deepEqual(newResponse, oldResponse) === false;

const poll = async () => {

  const treeDeePrinterResponse = {
    status: get3DPrinterStatus(),
    job: get3DPrinterJob(),
  };

  const previousResponse = await loadPreviousResponseFromFile();
  if (hasResponseChanged(treeDeePrinterResponse, previousResponse)) {
    console.log('response has changed');
    const database = firebase.database();
    const threeDeePrinter = database.ref('/3dprint');
    try {
      await threeDeePrinter.child('/status').update(treeDeePrinterResponse);
      console.log('wrote status to firebase');
    } catch (err) {
      console.log('3dprinter status update failed while writing to firebase');
    }
    await writeResponseToFile(treeDeePrinterResponse);
    firebase.database().goOffline();
  } else {
    console.log('response is unchanged');
  }
};

poll();