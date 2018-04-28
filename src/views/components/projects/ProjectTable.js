import map from 'lodash/map';
import forEach from 'lodash/forEach';
import isFunction from 'lodash/isFunction';
import groupBy from 'lodash/groupBy';
import mapValues from 'lodash/mapValues';
import zipObject from 'lodash/zipObject';
import pickBy from 'lodash/pickBy';
import merge from 'lodash/merge';
import toPairs from 'lodash/toPairs';
import sortBy from 'lodash/sortBy';
import isEmpty from 'lodash/isEmpty';
 

import React, { Component } from 'react';


/**
老師當機種身分:
  * 觀察者：從外面觀察（一點點時間），我們至少每周花過 5-10 min在每個團隊上面
  * 陪伴者：不一定參與製作，但會參與討論，從團隊裡面觀察，可能稍微帶領他們
  * 夥伴：
    * 主力：好好一起參與做，跟著帶領大家
    * 工具人：參與討論，當團隊工具人

Table columns:
* Icon + Title
* Contributors
* 負責 GM + GM 目前的 role/參與度
* 健康
* Buttons / 更多項目:
  * 紀錄、輯專案...

健康的因素：
* 主力的認真度、GM 的參與度、其他人的參與度
* 所有夥伴的目前 level vs. 表現？
* 專案規模（越大就越難做出來）
* 最近分享狀況
* 目前主要讓人卡住的問題
* 外力 (例如：接案的時候，會有外面的專案主人)

* 更多會不會成功的因素。。。。


更多專案的資訊與管理方式
* 主力跟其他的參與者
* 專案類別：case study、接案、自主創作、其他更多？


紀錄方式
* CRUD a list of 紀錄 (author, content)
* markdown (add pure links to markdown)
* Concepts
  * 觀察紀錄
  * 各種『健康』的因素
  * 他們的想法 vs. 我們的想法（他們有沒有看得出來我們看得出來的問題？他們有沒有在認真面對明顯的問題？）
  * Guardian 問過的問題／要問的問題
 */

 // see: https://codepen.io/Domiii/pen/ZXzPxz


function getCell(row, resource, week) {
  const cellName = resource + '_W' + week;
  return row[cellName];
}

function jobCellFactory(_data, resource) {
  return (cell, row, data) => {
    const jobName = getCell(row, resource, thisWeek);

    const oldJobName = getCell(row, resource, thisWeek - 1);

    let icon = '';
    let clazz = '';
    if (jobName !== oldJobName) {
      if (jobName === 'Baby') {
        clazz = 'color-red';
        icon = <span style={{ width: '24px', height: 'auto' }} src="http://icons.iconarchive.com/icons/icons8/ios7/512/Messaging-Cry-icon.png" >😭</span>
      }
      else if (oldJobName === 'Baby') {
        clazz = 'color-green';
        icon = <i className="fa fa-graduation-cap"></i>;
      }
      else {
        clazz = 'color-darkorange bold';
        icon = <i className="color-darkorange fa fa-share"></i>;
      }
    }

    return (<div className="leaderboard-cell">
      <div></div>
      <div>{icon}&nbsp;</div>
      <div><span className={clazz}>{jobName}</span></div>
      <div></div>
    </div>);
  };
}

function sortJobs(a, b, order) {
  const jobA = getCell(a, 'job', thisWeek) || '';
  const jobB = getCell(b, 'job', thisWeek) || '';

  if (order === 'desc') {
    return jobA.localeCompare(jobB);
  } else {
    return jobB.localeCompare(jobA);
  }
}

function resourceCellFactory(_data, resource, moreClasses) {
  return (cell, row, data) => {
    cell = cell || 0;
    if (!isNaN(cell)) {
      cell = Math.round(cell);
    }
    const colName = resource + '_W' + thisWeek;
    const delta = row[colName];
    const total = row[resource + '_total'];
    let icon = '';
    if (delta > 0) {
      icon = <i className="color-green fa fa-arrow-up"></i>;
    }
    else if (delta < 0) {
      icon = <i className="color-red fa fa-arrow-down"></i>;
    }
    return (<div className="leaderboard-cell">
      <div></div>
      <div>{icon}</div>
      <div><span className={moreClasses}>{total}</span></div>
      <div></div>
    </div>);
  };
}

function cardsCell(cards, row, data) {
  let cardEls;
  if (!isEmpty(cards)) {
    cards = toPairs(cards);
    cards = sortBy(cards, ([name, amount]) => -amount);
    cardEls = map(cards, ([name, amount]) => {
      const amountStr = Math.round(amount) === amount ? amount : amount.toFixed(2);
      const cardDesc = `${name} x ${amountStr}`;
      if (amount < 1) {
        return <p key={cardDesc} className="card-incomplete">{cardDesc}</p>;
      }
      else {
        return <p key={cardDesc} className="card-full">{cardDesc}</p>;
      }
    });
  }
  else {
    cardEls = <span className="card card-none">（無）</span>;
  }
  return (<div className="leaderboard-cell">
    <div>{cardEls}</div>
  </div>);
}

function studentCellFactory(name, row, data) {
  const link = (row.portfolioLink || '').trim();

  const clazz = !!link ? '' : 'color-red';
  const content = !!link ? (<a href={link}>{name}</a>) : name;
  return (<div className={clazz}>
    {content}
  </div>);
}

class ProjectTable extends Component {
  render() {
    const {
      data
    } = this.props;

    return (<div>
      <BootstrapTable bordered={true}
        data={data} striped={true} hover={true}
        trClassName={(row, rowIndex) => 'leaderboard-row'}>
        <TableHeaderColumn isKey={true}
          dataField="name"
          dataFormat={studentCellFactory}
          dataAlign="center" dataSort={true}>
          Name
        </TableHeaderColumn>
        <TableHeaderColumn
          dataField="job"
          dataFormat={jobCellFactory(data, 'job')}
          dataAlign="center" dataSort={true}
          sortFunc={sortJobs}>
          W{thisWeek} Job
     </TableHeaderColumn>
        <TableHeaderColumn
          dataField="mission_success"
          dataFormat={resourceCellFactory(data, 'mission_success', 'color-green')}
          dataAlign="center" dataSort={true}>
          W{thisWeek} M (SUCCESS)
     </TableHeaderColumn>
        <TableHeaderColumn
          dataField="mission_fail"
          dataFormat={resourceCellFactory(data, 'mission_fail', 'color-red')}
          dataAlign="center" dataSort={true}>
          W{thisWeek} M (FAIL)
     </TableHeaderColumn>
        <TableHeaderColumn
          dataField="cards"
          dataFormat={cardsCell}
          dataAlign="center" dataSort={false}>
          W{thisWeek} 卡片
     </TableHeaderColumn>
      </BootstrapTable>
    </div>);
  }
}