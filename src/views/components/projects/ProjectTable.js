import map from 'lodash/map';
import size from 'lodash/size';
import mapValues from 'lodash/mapValues';


import React, { Component } from 'react';
import { dataBind } from 'dbdi/react';
import { NOT_LOADED } from 'dbdi/util';

import {
  Button, Alert, Panel
} from 'react-bootstrap';
import Moment from 'react-moment';

import BootstrapTable from 'react-bootstrap-table-next';
import paginationFactory from 'react-bootstrap-table2-paginator';

import ImageLoader from 'src/views/components/util/react-imageloader';
import LoadIndicator from 'src/views/components/util/LoadIndicator';
import { EmptyObject } from '../../../util';

import ProjectContributorBar from './ProjectContributorBar';


const __defaultProps = {
  keyField: 'id',
  condensed: true,
  columns: [
    {
      dataField: 'id',
      text: ' ',
      hidden: true
    },
    {
      dataField: 'title',
      text: 'Title',
      sort: true
    },
    {
      dataField: 'contributors',
      text: 'Contributors',
      classes: 'min',
      headerClasses: 'min',
      sort: true,
      sortFunc: (a, b, order, dataField) => {
        if (order === 'asc') return a - b;
        else return b - a;
      }
    },
    {
      dataField: 'updatedAt',
      text: 'Last Update',
      classes: 'min',
      headerClasses: 'min',
      sort: true
    }
    // {
    //   dataField: 'contributors',
    //   text: 'Contributors'
    // }
  ],
  remote: true,
  defaultSorted: [{
    dataField: 'updatedAt',
    order: 'desc'
  }],

  paginationCfg: {
    withFirstAndLast: false, // hide the going to first and last page button
    alwaysShowAllBtns: true, // always show the next and previous page button
    firstPageText: 'First', // the text of first page button
    prePageText: 'Prev', // the text of previous page button
    nextPageText: 'Next', // the text of next page button
    lastPageText: 'Last', // the text of last page button
    nextPageTitle: 'Go to next', // the title of next page button
    prePageTitle: 'Go to previous', // the title of previous page button
    firstPageTitle: 'Go to first', // the title of first page button
    lastPageTitle: 'Go to last', // the title of last page button
    hideSizePerPage: true, // hide the size per page dropdown
    hidePageListOnlyOnePage: true, // hide pagination bar when only one page, default is false
  }
  // remote: {
  //   pagination: true,
  //   sort: true
  // },
  // overlay: overlayFactory({
  //   spinner: true,
  //   background: 'rgba(192,192,192,0.3)'
  // }),
};

function convertToTableData(objects, customTableData) {
  return map(objects, (o, id) => ({ 
    // a table row object must have an id
    id,

    // the actual data
    ...o,

    // custom data must be looked up and merged 
    //  (e.g. for contributor data we want only the count)
    ...mapValues(customTableData, fn => fn(id, o))
  }));
}

@dataBind({
  contributorCount(projectId, o, { }, { uidsOfProject }) {
    return size(uidsOfProject({ projectId }));
  }
})
export default class ProjectTable extends Component {
  state = {
  };

  constructor(props) {
    super(props);

    this.tableProps = Object.assign({}, __defaultProps);

    // assign renderers
    this.tableProps.columns.forEach(col => col.formatter = this['render_' + col.dataField]);

    // set paginationCfg
    this.paginationCfg = Object.assign({}, __defaultProps.paginationCfg);
    this.paginationCfg.page = 1;
    this.paginationCfg.onPageChange = this.onPageChange;

    // 
    this.customTableData = {
      contributors: props.contributorCount
    };
  }

  render_title(cell, row, rowIndex, formatExtraData) {
    const {
      title,
      iconUrl
    } = row;
    return (<span>
      <ImageLoader
        src={iconUrl}
        className="project-icon"
      />&nbsp;
      {title}
    </span>);
  }

  render_updatedAt(cell, row, rowIndex, formatExtraData) {
    return (<span>
      <Moment fromNow>{cell}</Moment> (
      <Moment format="MMMM Do YYYY, HH:mm:ss">{cell}</Moment>
      )
    </span>);
  }

  render_contributors(cell, row, rowIndex, formatExtraData) {
    const projectId = row.id;
    return (<ProjectContributorBar projectId={projectId}>
      &nbsp;
    </ProjectContributorBar>);
  }

  onPageChange = (page, sizePerPage) => {
    this.paginationCfg.page = page;
    this.paginationCfg.sizePerPage = sizePerPage;
    this.pagination = paginationFactory(this.paginationCfg);

    this.setState(EmptyObject); // re-render!
  }

  handleTableChange = (type, {
    sortField,
    sortOrder
  }) => {
    if (type === 'sort') {
      // handle sort change
      const { defaultSorted } = this.tableProps;
      defaultSorted[0].dataField = sortField;
      defaultSorted[0].order = sortOrder;

      this.setState(EmptyObject); // re-render!
    }
  }

  render(
    { },
    { projectsOfPage }
  ) {
    const { defaultSorted } = this.tableProps;
    const { page, sizePerPage } = this.paginationCfg;
    const list = projectsOfPage({
      page, sizePerPage,
      orderBy: defaultSorted[0].dataField,
      ascending: defaultSorted[0].order === 'asc',
    });
    if (list === NOT_LOADED) {
      return <LoadIndicator block message="loading projects..." />;
    }
    const data = convertToTableData(list, this.customTableData);

    const totalSize = size(data);
    this.paginationCfg.totalSize = Math.max(this.paginationCfg.totalSize, totalSize + 1);

    return (<div className="default-width">
      <BootstrapTable
        data={data}
        pagination={this.pagination}
        onTableChange={this.handleTableChange}

        {...__defaultProps} />
    </div>);
  }
}

/**
 * Add new SharingSessionView
 */

/**
 * Video Tagging:
 *  * add new "SharingSessionModel + Page"
 *  * import existing projects (with user names as notes/comments or description?)
 *  * make it easy to show/hide/edit notes (different from comments?)
 *  * table of projects
 *  * (also be able to append individual users, especially those who volunteer and those who have not shared recently)
 *  * tag projects (main speaker(s) vs. support)
 *  * tag users
 *  * add some sort of way of identifying "memorable moments" in videos
 *  * come back after a few months to automatically identify all "memorabl moments" and then spend one day on editing a compilation
 */


/**
 * More important concepts:
 * user roles: owner + supporting user roles in projects
 * seriousness of project/and participants
 * 每週分享狀態
 * length/output/efficiency/value of project?
 * timeline of project / of all projects
 * active vs. archived projects
 */



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

框架可以打掉
* 你在乎的 Project health/specs/團隊的參與度/等等 都是什麼？
    → 我們先提出一個，你們隨時隨地可以拒絕我們的標準且提出自己的標準～

健康的因素：
* 主力的認真度、GM 的參與度、其他人的參與度
* 所有夥伴的目前 level vs. 表現？
* 專案規模（越大就越難做出來）
* 最近分享狀況
* 目前主要讓人卡住的問題
* 外力 (例如：接案的時候，會有外面的專案主人)


更多會不會成功的因素。。。。
* 專案類別：case study、接案、自主創作、其他更多？

Meetings (認真討論這個 Project 的狀態)
* 有沒有加 Guardian
* 結果好不好？
* （不一定需要）
* （我們可以用這個 data 來比較：有平時 meeting／認真討論 + 沒有的分組之間的差別）

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


// function getCell(row, resource, week) {
//   const cellName = resource + '_W' + week;
//   return row[cellName];
// }

// function jobCellFactory(_data, resource) {
//   return (cell, row, data) => {
//     const jobName = getCell(row, resource, thisWeek);

//     const oldJobName = getCell(row, resource, thisWeek - 1);

//     let icon = '';
//     let clazz = '';
//     if (jobName !== oldJobName) {
//       if (jobName === 'Baby') {
//         clazz = 'color-red';
//         icon = (<span style={{ width: '24px', height: 'auto' }}
//           src="http://icons.iconarchive.com/icons/icons8/ios7/512/Messaging-Cry-icon.png" >
//           😭
//         </span>);
//       }
//       else if (oldJobName === 'Baby') {
//         clazz = 'color-green';
//         icon = <i className="fa fa-graduation-cap"></i>;
//       }
//       else {
//         clazz = 'color-darkorange bold';
//         icon = <i className="color-darkorange fa fa-share"></i>;
//       }
//     }

//     return (<div className="leaderboard-cell">
//       <div></div>
//       <div>{icon}&nbsp;</div>
//       <div><span className={clazz}>{jobName}</span></div>
//       <div></div>
//     </div>);
//   };
// }

// function sortJobs(a, b, order) {
//   const jobA = getCell(a, 'job', thisWeek) || '';
//   const jobB = getCell(b, 'job', thisWeek) || '';

//   if (order === 'desc') {
//     return jobA.localeCompare(jobB);
//   } 
//   else {
//     return jobB.localeCompare(jobA);
//   }
// }

// function resourceCellFactory(_data, resource, moreClasses) {
//   return (cell, row, data) => {
//     cell = cell || 0;
//     if (!isNaN(cell)) {
//       cell = Math.round(cell);
//     }
//     const colName = resource + '_W' + thisWeek;
//     const delta = row[colName];
//     const total = row[resource + '_total'];
//     let icon = '';
//     if (delta > 0) {
//       icon = <i className="color-green fa fa-arrow-up"></i>;
//     }
//     else if (delta < 0) {
//       icon = <i className="color-red fa fa-arrow-down"></i>;
//     }
//     return (<div className="leaderboard-cell">
//       <div></div>
//       <div>{icon}</div>
//       <div><span className={moreClasses}>{total}</span></div>
//       <div></div>
//     </div>);
//   };
// }

// function cardsCell(cards, row, data) {
//   let cardEls;
//   if (!isEmpty(cards)) {
//     cards = toPairs(cards);
//     cards = sortBy(cards, ([name, amount]) => -amount);
//     cardEls = map(cards, ([name, amount]) => {
//       const amountStr = Math.round(amount) === amount ? amount : amount.toFixed(2);
//       const cardDesc = `${name} x ${amountStr}`;
//       if (amount < 1) {
//         return <p key={cardDesc} className="card-incomplete">{cardDesc}</p>;
//       }
//       else {
//         return <p key={cardDesc} className="card-full">{cardDesc}</p>;
//       }
//     });
//   }
//   else {
//     cardEls = <span className="card card-none">（無）</span>;
//   }
//   return (<div className="leaderboard-cell">
//     <div>{cardEls}</div>
//   </div>);
// }

// function studentCellFactory(name, row, data) {
//   const link = (row.portfolioLink || '').trim();

//   const clazz = !!link ? '' : 'color-red';
//   const content = !!link ? (<a href={link}>{name}</a>) : name;
//   return (<div className={clazz}>
//     {content}
//   </div>);
// }