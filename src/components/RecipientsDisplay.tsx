import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'
import RecipientsBadge from './RecipientsBadge'
import styled from 'styled-components'
import { createPortal } from 'react-dom'

function getTextWidth(element: HTMLElement, text: string) {
  if (!element) return 0
  // I could use other alternatives, but this is the most accurate one.
  const style = window.getComputedStyle(element)
  const fontSize = style.getPropertyValue('font-size')
  const fontFamily = style.getPropertyValue('font-family')
  /* 
    Please note that this does not take into account screen zoom.
    For it to work properly, the zoom should be 100%, which is the default
    used by all browsers. The further away from this zoom, the higher the error rate the code may have.
    If you desire an alternative that works for all zoom levels, it could be calculated...
  */

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')!
  context.font = `${fontSize} ${fontFamily}`
  const widthText = context.measureText(text).width

  return widthText
}

function getWidth(element: HTMLElement) {
  if (!element) return 0
  const width = element.clientWidth

  return width
}

function getOnlyEmailsThatFit(
  element: HTMLElement,
  emails: string[],
  availableWidth: number,
): [string, number] {
  let emailsSoFar = emails[0]
  let numTruncated = 0
  const ellipsisWidth = getTextWidth(element, '...')

  for (let i = 1; i < emails.length; i++) {
    emailsSoFar = emailsSoFar + `, ${emails[i]}`
    const widthEmailsSoFar = getTextWidth(element, emailsSoFar)

    if (widthEmailsSoFar + ellipsisWidth > availableWidth) {
      numTruncated = emails.length - i
      const emailSplit = emailsSoFar.split(', ')

      emailSplit[emailSplit.length - 1] = '...'
      emailsSoFar = emailSplit.join(', ')
      break
    }
  }

  return [emailsSoFar, numTruncated]
}

// ----------------------------------------------------------------------
export type RecipientsTooltipProps = PropsWithChildren<{ recipients: string }>
function RecipientsTooltip({ recipients, ...rest }: RecipientsTooltipProps) {
  return createPortal(<div {...rest}>{recipients}</div>, document.body)
}
const StyledRecipientsTooltip = styled(RecipientsTooltip)`
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 8px 16px;
  background-color: #666;
  color: #f0f0f0;
  border-radius: 24px;
  display: flex;
  align-items: center;
`

// ----------------------------------------------------------------------
export type RecipientsDisplayProps = PropsWithChildren<{ recipients: string[] }>
function RecipientsDisplay({ recipients, ...rest }: RecipientsDisplayProps) {
  const recipientsRef = useRef<HTMLElement | null>(null)
  const badgeWidth = 28 // I set a fixed value because I assume that I created the badge myself and am familiar with it, as it is an internal component, although this could be done dynamically.

  const [availableEmail, setAvailableEmail] = useState(recipients[0])
  const [numTruncated, setNumTruncated] = useState(recipients.length - 1)

  const [countRerender, setCountRerender] = useState(0)

  const [showTooltip, setShowTooltip] = useState(false)

  useMemo(() => {
    const recipientsHtml = recipientsRef.current
    if (!recipientsHtml) return

    const recipientsWidth = getWidth(recipientsHtml.parentNode as HTMLElement)

    const ContainerWidthLessBadge = recipientsWidth - badgeWidth
    /* 
    I could obtain the width of the inside of the badge and add padding to have a
    more accurate width of it, but in most cases, 28 would be fine
    (as long as the number of emails is less than 9).
    Exact alternative: getTextWidth(recipientsRef.current, `+${numTruncated}`) + // padding
    */

    const [availableEmail, numTruncated] = getOnlyEmailsThatFit(
      recipientsHtml,
      recipients,
      ContainerWidthLessBadge,
    )

    setAvailableEmail(availableEmail)
    setNumTruncated(numTruncated)
  }, [recipients, countRerender])

  useEffect(() => {
    /* 
    I use counter rerender to recalculate everything in the rezise window and for the first time after having containersRef
    The ideal would be to use a debounce or to improve performance and not call setCountRerender many times
    I didn't do it because they ask that we not do extra functionalities and they don't demand maximum performance 
    */
    function incrementCountRerender() {
      setCountRerender(countBefore => countBefore + 1)
    }
    if (countRerender == 0) incrementCountRerender()
    window.addEventListener('resize', incrementCountRerender)
    return () => {
      window.removeEventListener('resize', incrementCountRerender)
    }
  }, [])

  return (
    <span ref={recipientsRef} {...rest}>
      <span>{availableEmail}</span>
      {showTooltip && (
        <StyledRecipientsTooltip recipients={recipients.join(', ')} />
      )}
      {numTruncated >= 1 && (
        <RecipientsBadge
          onMouseEnter={() => {
            if (!showTooltip) setShowTooltip(true)
          }}
          onMouseLeave={() => {
            if (showTooltip) setShowTooltip(false)
          }}
          numTruncated={numTruncated}
        />
      )}
    </span>
  )
}

export default styled(RecipientsDisplay)`
  display: flex;
  align-item: center;
  width: 100%;

  span:nth-child(1) {
    flex-grow: 1;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`
