import groupBy from 'lodash/groupBy';
import size from 'lodash/size';
import map from 'lodash/map';
import filter from 'lodash/filter';
import times from 'lodash/times';
import random from 'lodash/random';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import dataBind from 'src/dbdi/react/dataBind';

import DynamicForm from 'src/views/tools/DynamicForm';
import UserBadge from 'src/views/components/users/UserBadge';
import {
  Alert, Button, Jumbotron, Well
} from 'react-bootstrap';
import FAIcon from 'src/views/components/util/FAIcon';
import { NOT_LOADED } from '../../dbdi/react';
import LoadIndicator from 'src/views/components/util/LoadIndicator';
import { EmptyArray } from '../../util';


// ##########################################################################################
// RegistrationPage
// ##########################################################################################

@dataBind({})
export default class RegistrationPage extends Component {
  render(
    { },
    { },
    { currentUser, isCurrentUserDataComplete }
  ) {
    if (!currentUser) {
      // currentUser will be set eventually, thanks to UserModel.ensureUserInitialized
      return <LoadIndicator />;
    }

    let contentEl;
    if (!isCurrentUserDataComplete) {
      contentEl= <RegistrationDataCompletion />;
    }
    else {
      contentEl = <RegistrationFun />;
    }

    return (<div className="container no-padding">
      {contentEl}
    </div>);
  }
}


// ##########################################################################################
// RegistrationDataCompletion
// ##########################################################################################

const schemaTemplate = {
  name: 'userData',
  type: 'object',
  properties: [
    {
      id: 'fullName',
      title: '全名',
      type: 'string',
      isOptional: false
    },
    {
      id: 'photoURL',
      title: '圖片的網址',
      type: 'string',
      isOptional: false
    }
  ]
};

const uiSchema = {
  'ui:options': {
    inline: false
  },
  fullName: {
    'ui:placeholder': '你的全名',
    'ui:options': {
      inline: true
    }
  },
  photoURL: {
    'ui:widget': 'userIcon',
    'ui:placeholder': '你的圖片的網址',
    'ui:options': {
      inline: true
    }
  }
};

@dataBind({})
export class RegistrationDataCompletion extends Component {
  state = {
    isSaved: true
  };

  onStateChange = ({ isSaved }) => {
    this.setState({ isSaved });
    //console.log('onStateChange', isSaved);
  }

  render(
    { },
    { currentUser, setCurrentUserData },
    { }
  ) {
    const props = {
      schemaTemplate,
      uiSchema,

      reader: currentUser,
      writer: setCurrentUserData,

      onStateChange: this.onStateChange
    };

    const {
      isSaved
    } = this.state;

    return (<div>
      <h2>
        <center>
          Hi！請幫忙填一下基本資料～
        </center>
      </h2>

      <DynamicForm {...props}>
        {/* the Form children are rendered at the bottom of the form */}
        <Button disabled={isSaved} type="submit" bsStyle="info">
          <FAIcon name="save" /> Save!
        </Button>
      </DynamicForm>
    </div>);
  }
}

// ##########################################################################################
// RegistrationFun
// ##########################################################################################


function randomBsStyle() {
  const items = ['info', 'default', 'primary', 'warning', 'danger', 'success'];
  return items[Math.floor(Math.random() * items.length)];
}

function generateRandomStyles(n) {
  return times(n, i => ({
    contStyle: {
      top: random(0, 100) + '%',
      left: random(0, 100) + '%'
    },
    buttonBsStyle: randomBsStyle()
  }));
}

const defaultLabels = [
  '乖乖寶貝',
  '屁孩',
  '白癡',
  '不要煩我',
  'pikachu',
  'troll'
];

const labelUrls = {
  pikachu: 'https://media.giphy.com/media/BfFQeCJSNJcM8/giphy.gif',
  troll: 'https://i.imgur.com/P9NIhrd.png'
};

const cohortStyles = {
  height: '50vh'
};

const SelfLabelButton = dataBind({
  clickChangeLabel: (evt,
    { label }, { set_userSelfLabel }, { currentUid }
  ) => {
    const uidArgs = { uid: currentUid };
    return set_userSelfLabel(uidArgs, label);
  }
})(function SelfLabelButton(
  { bsStyle, label }, { userSelfLabel, clickChangeLabel }, { currentUid }
) {
  const uidArgs = { uid: currentUid };
  const currentLabel = userSelfLabel(uidArgs, label);
  const isSelected = label === currentLabel;

  let content;
  let clazz;
  if (labelUrls[label]) {
    content = <img src={labelUrls[label]} className="max-size-3" />;
    clazz = 'padding-01';
  }
  else {
    content = label;
  }

  return (<Button onClick={clickChangeLabel} bsStyle={bsStyle} bsSize="large"
    className={(isSelected && 'yellow-highlight-border') + ' ' + clazz}
    active={isSelected}
    disabled={isSelected}>
    {content}
  </Button>);
});

@dataBind({})
export class RegistrationFun extends Component {
  constructor(...args) {
    super(...args);

    this.dataBindMethods(
      'componentDidMount',
      'onInputUpdate'
    );
  }

  componentDidMount(
    { }, { userSelfLabel, set_userSelfLabel }, { currentUid }
  ) {
    setTimeout(() => {
      const uidArgs = { uid: currentUid };
      const label = userSelfLabel(uidArgs);
      if (!label) {
        set_userSelfLabel(uidArgs, '乖乖寶貝');
      }
    }, 300);
  }

  onInputReady = (inputEl) => {
    this.inputEl = inputEl;
  }

  onInputUpdate = (evt,
    { }, { set_userSelfLabel }, { currentUid }
  ) => {
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }
    this.updateTimer = setTimeout(() => {
      let label = this.inputEl.value;
      if (!label || !label.substring) {
        label = '乖乖寶貝';
      }
      if (label.length > 14) {
        label = label.substring(0, 14);
      }

      const uidArgs = { uid: currentUid };
      return set_userSelfLabel(uidArgs, label);
    }, 20);
  }

  getOrCreateGroupStyles(n) {
    let groupStyles = this.groupStyles;
    if (!groupStyles || groupStyles.length < n) {
      // reset group styles every 2 seconds
      if (!this.groupStyleTimer) {
        this.groupStyleTimer = setTimeout(() => {
          this.groupStyles = null;
          this.groupStyleTimer = null;
        }, 1200);
      }
      groupStyles = this.groupStyles = generateRandomStyles(n);
    }
    return groupStyles;
  }

  refresh = () => {
    // reset
    this.groupStyles = null;
    this.setState({});
  }

  render(
    { },
    { userSelfLabel },
    { usersOfCurrentCohort, currentUid, currentUser }
  ) {
    if (!currentUser) {
      return <LoadIndicator />;
    }

    const uidArgs = { uid: currentUid };
    const label = userSelfLabel(uidArgs) || '';

    let cohortStatusEl;
    if (!usersOfCurrentCohort) {
      cohortStatusEl = <LoadIndicator />;
    }
    else {
      const nUsers = size(usersOfCurrentCohort);
      const groups = groupBy(filter(usersOfCurrentCohort, u => !!u.selfLabel), 'selfLabel');
      defaultLabels.forEach(l => groups[l] = groups[l] || EmptyArray);
      const groupStyles = this.getOrCreateGroupStyles(size(groups));

      let i = 0;
      cohortStatusEl = (<div >
        <h3 className="inline inline-hcenter">已有 <span className="font-size-3 digital-number-font">{nUsers}</span> 個人登記成功</h3>
        <h2 className="inline">{labelUrls[label] && <img src={labelUrls[label]} className="height-5" />}</h2>
        <hr />
        <div className="margin-bottom-5">
          <div className="position-relative font-size-2" style={cohortStyles}>
            {map(groups, (g, label) => {
              const s = groupStyles[i++];
              return (<Well key={label} className="position-absolute no-wrap no-margin no-padding no-background" style={s.contStyle}>
                <SelfLabelButton bsStyle={s.buttonBsStyle} label={label} /> x {size(g)}
              </Well>);
            })}
          </div>
        </div>
      </div>);
    }

    return (<div>
      <center className="padding3">
        <h2>恭喜，<UserBadge size={2} uid={currentUid} />！你這隻 <input type="text" maxLength="14" size="18" placeholder={label}
          onChange={this.onInputUpdate} ref={this.onInputReady} /> 登記成功！</h2>
        {cohortStatusEl}
        <span>（其他人就是（可愛的）豬～）</span>
      </center>
    </div>);
  }
}