import CometChatBuilderApp from "./CometChat/CometChatBuilderApp";

const App = () => {
   return (
     /* CometChatBuilderApp requires a parent with explicit height & width to render correctly. 
     Adjust the height and width as needed.
     */
    <div style={{ width: "100vw", height: "100vh" }}>
      <CometChatBuilderApp />
    </div>
  );
};

export default App;