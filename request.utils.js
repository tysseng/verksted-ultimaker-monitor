// @flow
export const parseJSON = (response: any): Promise<*> => response.json();

export const checkStatus = (requestStackTrace: string) => async (response: any): Promise<*> => {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
    const statusText = response.statusText ? ', statusText is ' + response.statusText : '';
    const errorMessage = `Failed to make network request${statusText}`;
    const error = new Error(errorMessage);
    error.statusCode = response.status;
    error.requestStackTrace = requestStackTrace;

    // Response object does not stringify nicely, explicitly setting properties to get
    // proper logging.
    error.response = {
      ok: response.ok,
      redirected: response.redirected,
      status: response.status,
      statusText: response.statusText,
      type: response.type,
      url: response.url,
      useFinalURL: response.useFinalURL,
      body: await response.json(),
    };

    throw error;
  }
};
