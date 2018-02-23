import 'babel-polyfill';
import firebase from 'firebase';
import fetch from 'node-fetch';
import { checkStatus, parseJSON } from "./request.utils";

const app = firebase.initializeApp({
  databaseURL: 'https://bekk-lab.firebaseio.com',
});

const printerAddress = '10.0.50.35';
const apiLocation = `http://${printerAddress}/api/v1`;

const request = async (path: string) => {
  const requestStackTrace = new Error().stack;
  return fetch(`${apiLocation}${path}`)
    .then(checkStatus(requestStackTrace))
    .then(parseJSON);
};

const poll = async () => {
  const status = await request('/printer/status');
  const job = await request('/print_job');

  const database = firebase.database();

  const threeDeePrinter = database.ref('/3dprint');
  await threeDeePrinter.child('/job').update(job);
  await threeDeePrinter.child('/status').update({status: status});

  firebase.database().goOffline();
};

poll();