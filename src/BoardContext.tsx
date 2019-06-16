import * as React from "react";
import { Epic, Sprint, Story, SubTask } from "./JiraInterfaces";
import APIURL from "./ApiURL";

type BoardContextState = {
  projectKey: string;
  boardId: number;
  sprint: Sprint;
  stories: Story[];
  allSubtasks: SubTask[];
  selectedEpic: Epic | undefined;
};
const defaultBoardContext: BoardContextState = {
  projectKey: "",
  boardId: 0,
  sprint: {} as Sprint,
  stories: [] as Story[],
  allSubtasks: [] as SubTask[],
  selectedEpic: undefined
  // selectedAvatars: []
};

type BoardContextProps = {
  projectKey: string;
  boardId: number;
};
export const BoardContext = React.createContext<BoardContextState>(
  defaultBoardContext
);

class BoardContextProvider extends React.Component<
  BoardContextProps,
  BoardContextState
> {
  public state = defaultBoardContext;

  async componentWillReceiveProps(newProps: BoardContextProps) {
    const sprint = await this.fetchSprint(newProps.boardId);
    const stories = await this.fetchStories(newProps.boardId);
    const allSubtasks =
      stories &&
      stories.reduce(
        (acc: SubTask[], cur: Story) => acc.concat(cur.fields.subtasks),
        []
      );
    this.setState({
      projectKey: newProps.projectKey,
      boardId: newProps.boardId,
      sprint,
      stories,
      allSubtasks
    });
    // TODO: disable auto-refresh during dev
    //setInterval(() => this.fetchStories(), 20000);
  }

  private fetchSprint = async (boardId: number) => {
    return fetch(`${APIURL}/board/${boardId}/sprint`, {
      method: "get"
    })
      .then(res => res.json())
      .then(({ sprint }) => sprint);
  };
  private fetchStories = async (boardId: number) => {
    return fetch(`${APIURL}/board/${boardId}`, {
      method: "get"
    })
      .then(res => res.json())
      .then(({ stories }) => stories);
  };

  public updateSubtasks = (subtasks: SubTask[]) => {
    this.setState({ allSubtasks: subtasks });
  };
  public updateStories = (stories: Story[]) => {
    this.setState({ stories });
  };
  public saveSubtask = (subtask: SubTask, storyId: number) => {
    const allSubtasks = [...this.state.allSubtasks, subtask];
    let stories = this.state.stories;
    const index = stories.findIndex((s: Story) => s.id === String(storyId));
    stories[index].fields.subtasks.push(subtask);
    this.setState({ stories, allSubtasks });
  };
  public selectEpic = (epic: Epic | undefined) => {
    this.setState({ selectedEpic: epic });
  };

  render() {
    return (
      <BoardContext.Provider
        value={{
          ...this.state,
          updateSubtasks: this.updateSubtasks,
          updateStories: this.updateStories,
          saveSubtask: this.saveSubtask,
          selectEpic: this.selectEpic
        }}
      >
        {this.props.children}
      </BoardContext.Provider>
    );
  }
}
export default BoardContextProvider;
