class Presenter {
  constructor(response, url) {
    if (typeof url === "string") {
      this._url = url;
    }
    this._response = JSON.parse(response);
    this._item = this._response.response[0].result[0];
  }
}

module.exports = Presenter;
