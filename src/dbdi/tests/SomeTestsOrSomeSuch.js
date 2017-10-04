


const TestA = dataBind()(
  () => (<TestC setContext={{c: 'world'}} />)
);
const TestC = dataBind()(
  ({ c }) => (<pre>
  hello {c}!
</pre>)
);

