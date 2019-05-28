import * as R from 'ramda'
import { plugins } from '../../__fixtures__/plugins'
import {
  ActionCommitType,
  ActionType,
  BaseState,
  ChangeAction,
  getDocument,
  hasPendingChanges,
  PersistAction,
  reducer,
  State,
  Undoable
} from '../../src/store'

let state: State

beforeEach(() => {
  state = createInitialState({
    defaultPlugin: 'default',
    plugins,
    documents: {}
  })
})

describe('history', () => {
  test('history contains initialState', () => {
    const initial = {
      ...state,
      documents: { '0': { plugin: 'stateful' } }
    }
    state = createInitialState(initial)

    state = reducer(state, {
      type: ActionType.Change,
      payload: {
        id: '0',
        state: () => ({ counter: 1 })
      }
    })
    expect(state.history).toBeDefined()
    expect(state.history.initialState).toEqual(initial)
  })

  test('history remembers actions', () => {
    state = createInitialState({
      ...state,
      documents: { '0': { plugin: 'stateful' } }
    })

    const action: ChangeAction = {
      type: ActionType.Change,
      payload: {
        id: '0',
        state: () => ({ counter: 1 })
      }
    }
    state = reducer(state, action)
    expect(state.history.actions).toHaveLength(1)
    expect(state.history.actions[0]).toHaveLength(1)
    expect(state.history.actions[0][0]).toEqual(action)
  })

  test('history remembers undos for redo', () => {
    state = createInitialState({
      ...state,
      documents: { '0': { plugin: 'stateful' } }
    })
    state = reducer(state, {
      type: ActionType.Change,
      payload: {
        id: '0',
        state: () => ({ counter: 1 })
      }
    })
    state = reducer(state, {
      type: ActionType.Undo
    })
    expect(state.history.redoStack).toHaveLength(1)
    expect(state.history.actions).toHaveLength(0)

    state = reducer(state, {
      type: ActionType.Redo
    })
    expect(state.history.redoStack).toHaveLength(0)
    expect(state.history.actions).toHaveLength(1)
  })

  test('history purges redos after change', () => {
    state = createInitialState({
      ...state,
      documents: { '0': { plugin: 'stateful' } }
    })
    state = reducer(state, {
      type: ActionType.Change,
      payload: {
        id: '0',
        state: () => ({ counter: 1 })
      },
      commit: ActionCommitType.ForceCommit
    })
    state = reducer(state, {
      type: ActionType.Undo
    })
    expect(state.history.redoStack).toHaveLength(1)
    expect(state.history.actions).toHaveLength(0)

    state = reducer(state, {
      type: ActionType.Change,
      payload: {
        id: '0',
        state: () => ({ counter: 2 })
      },
      commit: ActionCommitType.ForceCommit
    })

    expect(state.history.redoStack).toHaveLength(0)
    expect(state.history.actions).toHaveLength(1)
  })

  test('history combines debounced changes', () => {
    state = createInitialState({
      ...state,
      documents: { '0': { plugin: 'stateful' } }
    })
    state = reducer(state, {
      type: ActionType.Change,
      payload: {
        id: '0',
        state: () => ({ counter: 1 })
      }
    })
    expect(state.history.actions).toHaveLength(1)
    state = reducer(state, {
      type: ActionType.Change,
      payload: {
        id: '0',
        state: () => ({ counter: 2 })
      }
    })
    expect(state.history.actions).toHaveLength(1)

    state = reducer(state, {
      type: ActionType.Change,
      payload: {
        id: '0',
        state: () => ({ counter: 4 })
      },
      commit: ActionCommitType.ForceCommit
    })
    expect(state.history.actions).toHaveLength(2)
    state = reducer(state, {
      type: ActionType.Change,
      payload: {
        id: '0',
        state: () => ({ counter: 2 })
      }
    })
    expect(state.history.actions).toHaveLength(3)
  })

  test('undo change action', () => {
    state = createInitialState({
      ...state,
      documents: { '0': { plugin: 'stateful' } }
    })
    state = reducer(state, {
      type: ActionType.Change,
      payload: {
        id: '0',
        state: () => ({ counter: 1 })
      },
      commit: ActionCommitType.ForceCommit
    })
    state = reducer(state, {
      type: ActionType.Change,
      payload: {
        id: '0',
        state: () => ({ counter: 2 })
      },
      commit: ActionCommitType.ForceCommit
    })
    state = reducer(state, {
      type: ActionType.Undo
    })

    expect(getDocument(state, '0')).toEqual({
      plugin: 'stateful',
      state: { counter: 1 }
    })
  })

  test('redo change action', () => {
    state = createInitialState({
      ...state,
      documents: { '0': { plugin: 'stateful' } }
    })
    state = reducer(state, {
      type: ActionType.Change,
      payload: {
        id: '0',
        state: () => ({ counter: 1 })
      },
      commit: ActionCommitType.ForceCommit
    })
    state = reducer(state, {
      type: ActionType.Change,
      payload: {
        id: '0',
        state: () => ({ counter: 2 })
      },
      commit: ActionCommitType.ForceCommit
    })
    state = reducer(state, {
      type: ActionType.Undo
    })
    state = reducer(state, {
      type: ActionType.Redo
    })

    expect(getDocument(state, '0')).toEqual({
      plugin: 'stateful',
      state: { counter: 2 }
    })
  })

  test('undo/redo works with debounced changes', () => {
    state = createInitialState({
      ...state,
      documents: { '0': { plugin: 'stateful' } }
    })
    state = reducer(state, {
      type: ActionType.Change,
      payload: {
        id: '0',
        state: () => ({ counter: 1 })
      }
    })
    state = reducer(state, {
      type: ActionType.Change,
      payload: {
        id: '0',
        state: () => ({ counter: 2 })
      }
    })

    state = reducer(state, {
      type: ActionType.Undo
    })
    expect(getDocument(state, '0')).toEqual({
      plugin: 'stateful'
    })
    state = reducer(state, {
      type: ActionType.Redo
    })
    expect(getDocument(state, '0')).toEqual({
      plugin: 'stateful',
      state: { counter: 2 }
    })
  })
})

describe('persist', () => {
  test('hasPendingChanges returns false at start and after persist', () => {
    expect(hasPendingChanges(state)).toEqual(false)
    state = reducer(state, {
      type: ActionType.Insert,
      payload: {
        id: '0',
        plugin: 'stateful',
        state: { counter: 0 }
      }
    })
    state = reducer(state, {
      type: ActionType.Change,
      payload: {
        id: '0',
        state: () => ({ counter: 1 })
      },
      commit: ActionCommitType.ForceCommit
    })

    expect(hasPendingChanges(state)).toEqual(true)

    state = reducer(state, {
      type: ActionType.Persist
    })

    expect(hasPendingChanges(state)).toEqual(false)
  })

  test('undo/redo after persist work', () => {
    const insertAction: Undoable = {
      type: ActionType.Insert,
      payload: {
        id: '0',
        plugin: 'stateful',
        state: { counter: 0 }
      }
    }
    const changeAction: Undoable = {
      type: ActionType.Change,
      payload: {
        id: '0',
        state: () => ({ counter: 1 })
      },
      commit: ActionCommitType.ForceCommit
    }

    const persistAction: PersistAction = {
      type: ActionType.Persist
    }

    state = reducer(state, insertAction)
    const stateBeforeChange = { ...state }
    state = reducer(state, changeAction)
    state = reducer(state, persistAction)
    const stateAfterPersist = { ...state }

    // check undo
    state = reducer(state, {
      type: ActionType.Undo
    })
    expect(hasPendingChanges(state)).toEqual(true)
    expect(R.omit(['history'], state)).toEqual(
      R.omit(['history'], stateBeforeChange)
    )
    expect(state.history.redoStack).toHaveLength(1)

    //check redos
    state = reducer(state, {
      type: ActionType.Redo
    })

    expect(state).toEqual(stateAfterPersist)
  })

  test("persist doesn't remove redos", () => {
    state = reducer(state, {
      type: ActionType.Insert,
      payload: {
        id: '0',
        plugin: 'stateful',
        state: { counter: 0 }
      }
    })
    state = reducer(state, {
      type: ActionType.Change,
      payload: {
        id: '0',
        state: () => ({ counter: 1 })
      },
      commit: ActionCommitType.ForceCommit
    })

    state = reducer(state, {
      type: ActionType.Undo
    })

    expect(hasPendingChanges(state)).toEqual(true)
    expect(state.history.redoStack).toHaveLength(1)
    const redoStack = [...state.history.redoStack]

    state = reducer(state, {
      type: ActionType.Persist
    })

    expect(hasPendingChanges(state)).toEqual(false)
    expect(state.history.redoStack).toEqual(redoStack)
  })
})

function createInitialState(baseState: BaseState): State {
  return {
    ...baseState,
    history: {
      initialState: baseState,
      actions: [],
      redoStack: [],
      pending: 0
    },
    clipboard: [],
    editable: true
  }
}
