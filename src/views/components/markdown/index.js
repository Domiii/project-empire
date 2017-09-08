import React, { Component, PropTypes } from 'react';
import CodeBlock from './CodeBlock';
import ReactMarkdown from 'react-markdown';

// Adapted from: https://github.com/rexxars/react-markdown/blob/master/demo/src/demo.js
// For renderer implementations, consider: https://github.com/rexxars/commonmark-react-renderer/blob/master/src/commonmark-react-renderer.js#L18
export default class Markdown extends Component {
  constructor(props) {
    super(props);

    this.renderers = Object.assign({}, Markdown.renderers, {
      CodeBlock: CodeBlock
    });
  }

  render() {
    return (<ReactMarkdown className="markdown" source={this.props.source} renderers={this.renderers} />);
  }
}