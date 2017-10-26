import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import CodeBlock from './CodeBlock';
import ReactMarkdown from 'react-markdown';

// Adapted from: https://github.com/rexxars/react-markdown/blob/master/demo/src/demo.js
// For renderer implementations, consider: https://github.com/rexxars/commonmark-react-renderer/blob/master/src/commonmark-react-renderer.js#L18
export default class Markdown extends PureComponent {
  static propTypes = {
    source: PropTypes.string
  };

  constructor(props) {
    super(props);

    this.renderers = Object.assign({}, Markdown.renderers, {
      CodeBlock: CodeBlock
    });
  }

  render() {
    return (<ReactMarkdown className="markdown" source={this.props.source || ''} renderers={this.renderers} />);
  }
}