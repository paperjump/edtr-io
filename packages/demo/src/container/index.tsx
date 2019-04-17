import { Editor, EditorProps } from '@edtr-io/core'
import { select } from '@storybook/addon-knobs'
import * as R from 'ramda'
import * as React from 'react'

import { plugins } from '../plugins'
import { PlainContainer } from './plain'
import { SerloContainer } from './serlo'

enum Container {
  Plain = 'Plain',
  Serlo = 'Serlo'
}

const Components = {
  [Container.Plain]: PlainContainer,
  [Container.Serlo]: SerloContainer
}

export function EditorStory(props: Partial<EditorProps>) {
  const defaultContainer =
    (localStorage.getItem('storybook.container') as Container) ||
    Container.Plain
  const container = select('Container', R.values(Container), defaultContainer)
  React.useEffect(() => {
    localStorage.setItem('storybook.container', container)
  }, [container])
  const Component = Components[container]

  return (
    <Editor plugins={plugins} defaultPlugin="text" {...props}>
      {document => {
        return <Component>{document}</Component>
      }}
    </Editor>
  )
}