import React from 'react';
import ReactDOM from 'react-dom';
import Game from './game';
import {Provider, connect} from 'react-redux';
import {createStore} from 'redux';
import { gameState, updateBoard, getBoard } from './redux/actions';
import rootReducer from './redux/reducers';

const store = createStore(rootReducer);

Array.prototype.reshape = function(rows, cols) {
  var copy = this.slice(0); // Copy all elements.
  var col = [];

  for (var r = 0; r < rows; r++) {
    var row = [];
    for (var c = 0; c < cols; c++) {
      var i = r * cols + c;
      if (i < copy.length) {
        row.push(copy[i]);
      }
    }
    col.push(row);
  }

  return col;
};

export default function phrases_init(root, channel) {
  ReactDOM.render(
    <Provider store={store}>
      <PhrasesWithPhriends channel={channel}/>
    </Provider>,
    root
  );
}

let hasBeenJoined = false;

class PhrasesWithPhriends extends React.Component {

  constructor(props) {
    super(props);
    this.turns = 0;
    this.channel = props.channel;
    this.state = {
      board: []
    };
    this.grid = [];
    if (!hasBeenJoined) {
      hasBeenJoined = true;
      this.channel.join().receive("ok", this.set_view.bind(this)).receive("error", res => { console.log("Unable to join", res)});
    }
  }

  // componentWillUnmount() {
  //   this.channel.push("disconnect", {}).receive("ok", this.set_view.bind(this));
  // }

  set_view(view) {
    let { board, player, scores, turn } = view;
    player.hand = player.hand.map(val => String.fromCharCode(val))
    this.props.gameState({
      board,
      player,
      scores,
      turn
    });
    this.setState({
      board,
      player,
      scores,
      turn
    });
    this.grid = board.reshape(15, 15);
  }

  validMove(row, col) {
    this.grid = this.state.board.reshape(15, 15);
    if (this.grid) {
      return (!!this.grid[col][row + 1] ||
              !!this.grid[col][row - 1] ||
              !!this.grid[col + 1][row] ||
              !!this.grid[col - 1][row])
    } else {
      return true;
    }
  }

  handleDrop(space) {
    this.props.updateBoard(this.state.board, space);

    const { board } = store.getState().reducer

    this.setState({
      board
    });

    this.grid = board.reshape(15, 15);
  }

  render() {
    if (this.state.board.length > 0) {
      let { board, scores, player, turn } = this.state;
      return (
        <div>
          <Game
            board={board}
            scores={scores}
            player={player}
            turn={turn}
            turns={this.turns}
            channel={this.channel}
            onDrop={this.handleDrop.bind(this)}
            validMove={this.validMove.bind(this)}
          />
        </div>
      );
    } else {
      return <div/>
    }
  }
}

const mapStateToProps = state => {
  return {
    board: state.board
  }
};

const mapDispatchToProps = dispatch => {
  return {
    gameState: (state) => dispatch(gameState(state)),
    updateBoard: (board) => dispatch(updateBoard(board)),
    getBoard: () => dispatch(getBoard())
  }
}

PhrasesWithPhriends = connect(mapStateToProps, mapDispatchToProps)(PhrasesWithPhriends);
