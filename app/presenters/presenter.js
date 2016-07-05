class Presenter {
  constructor(response) {
    this._response = response;
    this._item = response.result[0];
  }
}

module.exports = Presenter;
