// adapted from: https://github.com/rexxars/react-markdown/blob/master/demo/src/code-block.js

// TODO: play around with themes (https://github.com/isagalaev/highlight.js/tree/master/src/styles)

import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import hljs from 'highlight.js';
import 'highlight.js/styles/ocean.css';

let init = false;

export default class CodeBlock extends PureComponent {
  static propTypes = {
    literal: PropTypes.string,
    language: PropTypes.string
  };

  componentDidMount() {
    this.highlightCode();
  }

  componentDidUpdate() {
    this.highlightCode();
  }

  highlightCode() {
    // if (!init) {
    //   hljs.initHighlightingOnLoad();
    //   init = true;
    // }
    if (this.refs.code) {
      hljs.highlightBlock(this.refs.code);
    }
  }

  renderDefault() {
    const style = {
      margin: '4px 0'
    };
    return (<div style={style}>
      <pre className="hljs no-margin no-padding">
        <code ref="code"
          className={this.props.language}>
          {this.props.literal}
        </code>
      </pre>
    </div>);
  }

  render() {
    return (
      this.renderDefault()
    );
  }
}