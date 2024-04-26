import styled from 'styled-components'
import type { ComponentPropsWithoutRef } from 'react'

export type RecipientsBadgeProps = {
  numTruncated: number
} & Omit<ComponentPropsWithoutRef<'span'>, 'className' | 'style'>

function RecipientsBadge({ numTruncated, ...rest }: RecipientsBadgeProps) {
  return (
    <span {...rest} data-testid="badge">
      +{numTruncated}
    </span>
  )
}

export default styled(RecipientsBadge)`
  flex-shrink: 0;
  padding: 2px 5px;
  border-radius: 3px;
  background-color: var(--color-primary);
  color: #f0f0f0;
  overflow: hidden;
`
