import React, { Component } from 'react';
import PropTypes from 'prop-types';
import dataBind from 'src/dbdi/react/dataBind';

import {
  Alert, Button, Jumbotron, Well, Panel
} from 'react-bootstrap';

import {
  LinkContainer
} from 'react-router-bootstrap';
import { LoadOverlay } from 'src/views/components/overlays';

import RoleManager from 'src/views/components/admin/RoleManager';

@dataBind({

})
export default class GMPage extends Component {
  constructor(...args) {
    super(...args);
  }

  render({ }, { }, { isCurrentUserAdmin, currentUser_isLoaded }) {
    if (!currentUser_isLoaded) {
      return (<LoadOverlay />);
    }
    if (!isCurrentUserAdmin) {
      return (<Alert bsStyle="warning">GMs only :/</Alert>);
    }

    return (
      <div>
        <Panel bsStyle="primary">
          <Panel.Heading>
            Roles
          </Panel.Heading>
          <Panel.Body>
            <RoleManager />
          </Panel.Body>
        </Panel>

        <Well>
          TODO:
          <pre>{`* 學習菜單: https://pecu.gitbooks.io/-r/content/
* 反思問題
* 上次的目標是不是讓妳很想要投入的？
* 上次的目標怎麼選的？
* 你需不需要設定目標的幫助？
* TODO: 花力氣 + 時間安排：探索 vs. 碰新的概念 vs. 用已經有經驗的概念來創作
* TODO: 針對自己各種各樣的學習的部分 － 難不難？有不有趣？是不是很耗時間、耗力氣？有沒有投入度？
* TODO: 直接他們有哪一些需要幫助的需求？列出一大堆～
* TODO: Performance indicators (consider papers and literature):
* Invest a lot of time + engage with high energy without anyone asking you to
* Solve many/difficult/self-defined problems
* Explore ... TODO!?
* Interact productively with peers
* Share insights (on stage or online)`}
          </pre>
        </Well>
      </div>
    );
  }
}