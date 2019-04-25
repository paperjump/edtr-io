import * as React from 'react'
import {
  Editor,
  EditorContext,
  getClipboard,
  PluginState,
  getPlugins
} from '@edtr-io/core'
import { styled } from '@edtr-io/editor-ui'
import { ThemeProps } from '@edtr-io/ui'
import { createRowPluginTheme } from '..'

const ClipboardHeader = styled.div({
  fontSize: 20,
  textAlign: 'center',
  marginBottom: '10px'
})

const Container = styled.div(
  ({ name, ...props }: ThemeProps & { name: string }) => {
    const theme = createRowPluginTheme(name, props.theme)
    return {
      textAlign: 'center',
      backgroundColor: theme.menu.secondary.backgroundColor,
      color: theme.menu.secondary.color,
      padding: 15,
      borderRadius: 5
    }
  }
)

const ButtonContainer = styled.div({
  marginTop: '10px',
  display: 'flex',
  flexFlow: 'row wrap',
  justifyContent: 'space-evenly'
})

const Preview = styled.div({
  display: 'flex',
  width: '80px',
  height: '45px',
  overflow: 'hidden',
  border: '1px solid black',
  margin: '0 5px'
})

const Button = styled.div({
  cursor: 'pointer'
})

const PreventMouseEvents = styled.div({
  pointerEvents: 'none'
})

export const Clipboard: React.FunctionComponent<{
  onClose: (pluginState: PluginState) => void
  name: string
}> = ({ name, ...props }) => {
  const store = React.useContext(EditorContext)
  const states = getClipboard(store.state)
  return (
    <Container name={name}>
      <ClipboardHeader> Zwischenablage </ClipboardHeader>
      <ButtonContainer>
        {states.length ? (
          states.map((state, index) => {
            return (
              <Button key={index} onClick={() => props.onClose(state)}>
                <Preview>
                  <PreventMouseEvents>
                    <Editor
                      plugins={getPlugins(store.state)}
                      defaultPlugin={store.state.defaultPlugin}
                      initialState={state}
                      editable={false}
                    />
                  </PreventMouseEvents>
                </Preview>
                <div>{state.plugin}</div>
              </Button>
            )
          })
        ) : (
          <div>Keine Elemente vorhanden</div>
        )}
      </ButtonContainer>
    </Container>
  )
}
