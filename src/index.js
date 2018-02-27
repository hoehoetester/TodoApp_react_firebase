import React from "react";
import { render } from "react-dom";
import firebase from 'firebase';

import config from './config';

const firebaseApp = firebase.initializeApp(config),
    firebaseDb = firebaseApp.database(),
    firebaseRef = firebaseDb.ref('/todos');

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            todos: [],
            filter: 'All'
        };
    }

    componentWillMount() {
        firebaseRef.on('child_added', snapshot => {
            const newTodo = {
                id: snapshot.key,
                description: snapshot.val().description,
                isCompleted: snapshot.val().isCompleted
            };

            this.updateStateTodos([...this.state.todos, newTodo]);
        });

        firebaseRef.on('child_changed', snapshot => {
            const newTodos = this.state.todos.map(todo => {
                if (todo.id === snapshot.key) {
                    todo.isCompleted = snapshot.val().isCompleted;
                }
                return todo;
            });

            this.updateStateTodos(newTodos);
        });

        firebaseRef.on('child_removed', snapshot => {
            const newTodos = this.state.todos.filter(todo => {
                return todo.id !== snapshot.key;
            });

            this.updateStateTodos(newTodos);
        });
    }

    updateStateTodos(newTodos) {
        this.setState({
            todos: newTodos
        });
    }

    handleAddTodo(value) {
        const newTodo = {
            description: value,
            isCompleted: false
        };

        firebaseRef.push(newTodo);
    }

    handleChangeComplet(id, isCompleted) {
        firebaseDb.ref(`/todos/${id}`).update({ isCompleted });
    }

    handleDeleteTodo(id) {
        firebaseDb.ref(`/todos/${id}`).remove();
    }

    handleChangeFilter(filter) {
        this.setState({
            filter
        });
    }

    render() {
        const filter = this.state.filter,
            filteredTodos = this.state.todos.filter(todo => {
                switch (filter) {
                    case 'All':
                        return todo;
                    case 'Completed':
                        return todo.isCompleted;
                    case 'Incompleted':
                        return !todo.isCompleted;
                    default:
                        return todo;
                }
            });

        return (
            <div>
                <h2>Todo App</h2>
                <TodoForm submitForm={this.handleAddTodo.bind(this)} />
                <TodoList
                    todos={filteredTodos}
                    toggleComplete={this.handleChangeComplet.bind(this)}
                    deleteTodo={this.handleDeleteTodo.bind(this)}
                    changeFilter={this.handleChangeFilter.bind(this)} />
            </div>
        );
    }
}

class TodoList extends React.Component {
    render() {
        const todos = this.props.todos.map(todo => {
            // debugger
            return <li key={todo.id}>
                <input type="checkbox" checked={todo.isCompleted}
                    onChange={(e) => { this.props.toggleComplete(todo.id, e.target.checked); }}
                />
                {todo.description}
                <button onClick={e => { this.props.deleteTodo(todo.id); }}>&times;</button>
            </li>;
        });
        return (
            <ul>
                <h3>{todos.length} todo(s)</h3>
                <p>
                    <select onChange={e => { this.props.changeFilter(e.target.value); }}>
                        <option value="All">All</option>
                        <option value="Completed">Completed</option>
                        <option value="Incompleted">Incompleted</option>
                    </select>
                </p>
                {todos}
            </ul>
        );
    }
}

class TodoForm extends React.Component {
    onSubmit(e) {
        e.preventDefault();
        this.props.submitForm(this.newTodoInput.value);
        this.newTodoInput.value = '';
    }
    render() {
        return (
            <div>
                <form
                    onSubmit={e => {
                        this.onSubmit(e);
                    }}
                >
                    <input
                        type="text"
                        required
                        ref={elm => {
                            this.newTodoInput = elm;
                        }}
                    />
                </form>
            </div>
        );
    }
}


render(<App />, document.getElementById("root"));