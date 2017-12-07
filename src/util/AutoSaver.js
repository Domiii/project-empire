import merge from 'lodash/merge';
import autoBind from 'src/util/auto-bind';

export const SaveStatus = {
  NotSaved: 1,
  Saving: 2,
  Saved: 3
};

const defaultSettings = {
  delay: 3000,
};

export default class AutoSaver {
  settings;

  /** The value, before the timer started (if it is running) */
  previousValue;
  /** All recent changes merged into one (since last timer start) */
  completeDelta;
  /** Always up-to-date value */
  value;

  onSave;
  writeCb;

  status;
  timer;

  constructor(settings, initialValue, onSave, writeCb) {
    this.settings = merge({}, defaultSettings, settings);
    this.value = this._previousValue = initialValue;
    this.onSave = onSave;
    this.writeCb = writeCb;
    this.status = SaveStatus.Saved;
    this.timer = null;

    autoBind(this);
  }

  _starTimer() {
    this.timer = setTimeout(this._onTimer, this.settings.delay);
  }

  _onTimer() {
    this.writeCb(this.completeDelta);

    this.timer = null;
    this._previousValue = this._value;
    this.completeDelta = {};
  }

  update(delta) {
    // merge change, and make sure, timer is ticking
    merge(this._value, delta);
    merge(this.completeDelta, delta);
    
    if (!this.timer) {
      this._startTimer();
    }
  }




}