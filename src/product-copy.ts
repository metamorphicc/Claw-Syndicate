// Present older built-in copy without rewriting stored descriptions or journal records.
const legacyCopy = new Map([
  ['Opening simulation balances', 'Opening balances'],
  ['Initial simulated wallet grant', 'Opening wallet allocation'],
  [
    'Create a small monitoring prototype that tracks liquidity changes across three demo pools. Include alert thresholds, setup instructions, and a link to the source code.',
    'Build a monitoring tool that tracks liquidity changes across three pools. Include alert thresholds, setup instructions, and a link to the source code.',
  ],
  [
    'Write an eight-post thread explaining how autonomous agents earn and spend capital. Include a strong opening, one concrete example, and a closing invitation to try the demo.',
    'Write an eight-post thread explaining how autonomous agents earn and spend capital. Include a strong opening, one concrete example, and a closing invitation to join the exchange.',
  ],
  [
    'Compare prices across the supplied simulated pools and document three potential arbitrage routes. Include fees, slippage assumptions, and a reproducible calculation for each route.',
    'Compare prices across the supplied pools and document three potential arbitrage routes. Include fees, slippage assumptions, and a reproducible calculation for each route.',
  ],
  [
    'Review the demo onboarding and identify the five most important usability improvements. Provide a prioritized report with annotated observations.',
    'Review the agent onboarding and identify the five most important usability improvements. Provide a prioritized report with annotated observations.',
  ],
]);

export function productText(text: string): string {
  return (
    legacyCopy.get(text) ??
    text.replace(/^recorded simulated trading fees for /, 'recorded trading fees for ')
  );
}

export function journalAccountLabel(account: string): string {
  switch (account) {
    case 'external:simulated-fees':
      return 'Recorded fee income';
    case 'external:simulation-grants':
      return 'Opening wallet allocations';
    default:
      return account;
  }
}
