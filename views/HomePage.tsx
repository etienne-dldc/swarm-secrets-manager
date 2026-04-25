import { css } from "hono/css";
import type { FC } from "hono/jsx";

export type SecretView = {
  id: string;
  name: string;
  shortId: string;
  createdAt: string;
};

type HomePageProps = {
  secrets: SecretView[];
  ok?: string | null;
  error?: string | null;
};

export const HomePage: FC<HomePageProps> = ({ secrets, ok, error }) => {
  const flashClass = css`
    border-radius: 8px;
    padding: 10px 12px;
    margin-bottom: 12px;
    font-size: 0.95rem;
  `;

  const flashOkClass = css`
    background: #ecfdf5;
    color: #065f46;
  `;

  const flashErrorClass = css`
    background: #fef2f2;
    color: #991b1b;
  `;

  const cardClass = css`
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 16px;
    margin-bottom: 16px;
    box-shadow: 0 6px 22px rgba(0, 0, 0, 0.04);
  `;

  const gridClass = css`
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
  `;

  const labelClass = css`
    font-weight: 600;
    font-size: 0.92rem;
  `;

  const textInputClass = css`
    width: 100%;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 10px;
    font: inherit;
    margin-top: 6px;
  `;

  const textareaClass = css`
    width: 100%;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 10px;
    font: inherit;
    margin-top: 6px;
    min-height: 120px;
    resize: vertical;
  `;

  const buttonClass = css`
    border: 0;
    border-radius: 8px;
    padding: 10px 14px;
    background: #0f766e;
    color: white;
    font-weight: 600;
    cursor: pointer;
  `;

  const dangerButtonClass = css`
    background: #b91c1c;
  `;

  const hintClass = css`
    color: #6b7280;
    margin-top: 8px;
    font-size: 0.9rem;
  `;

  const tableWrapClass = css`
    overflow-x: auto;
  `;

  const tableClass = css`
    width: 100%;
    border-collapse: collapse;
  `;

  const cellClass = css`
    text-align: left;
    padding: 10px 8px;
    border-bottom: 1px solid #e5e7eb;
    vertical-align: top;
  `;

  const headerCellClass = css`
    color: #6b7280;
    font-weight: 600;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  `;

  const responsiveRowClass = css`
    @media (max-width: 700px) {
      display: block;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      margin-bottom: 10px;
      padding: 10px;
    }
  `;

  const responsiveCellClass = css`
    @media (max-width: 700px) {
      display: block;
      border: 0;
      padding: 6px 0;
    }
  `;

  const responsiveHeadClass = css`
    @media (max-width: 700px) {
      display: none;
    }
  `;

  const responsiveTableSectionClass = css`
    @media (max-width: 700px) {
      display: block;
    }
  `;

  return (
    <>
      {ok ? <div class={`${flashClass} ${flashOkClass}`}>{ok}</div> : null}
      {error
        ? <div class={`${flashClass} ${flashErrorClass}`}>{error}</div>
        : null}

      <section class={cardClass}>
        <h2>Create Secret</h2>
        <form method="post" action="/create" class={gridClass}>
          <label class={labelClass}>
            Name
            <input
              class={textInputClass}
              type="text"
              name="name"
              placeholder="my_secret"
              maxLength={128}
              required
            />
          </label>
          <label class={labelClass}>
            Value
            <textarea
              class={textareaClass}
              name="value"
              placeholder="Paste secret value"
              required
            >
            </textarea>
          </label>
          <div>
            <button class={buttonClass} type="submit">Create Secret</button>
          </div>
        </form>
        <p class={hintClass}>
          Secret values are write-only in this UI and never listed back.
        </p>
      </section>

      <section class={cardClass}>
        <h2>Existing Secrets ({secrets.length})</h2>
        <div class={tableWrapClass}>
          <table class={tableClass}>
            <thead class={responsiveHeadClass}>
              <tr>
                <th class={`${cellClass} ${headerCellClass}`}>Name</th>
                <th class={`${cellClass} ${headerCellClass}`}>ID</th>
                <th class={`${cellClass} ${headerCellClass}`}>Created</th>
                <th class={`${cellClass} ${headerCellClass}`}>Action</th>
              </tr>
            </thead>
            <tbody class={responsiveTableSectionClass}>
              {secrets.length === 0
                ? (
                  <tr class={responsiveRowClass}>
                    <td
                      class={`${cellClass} ${responsiveCellClass}`}
                      colSpan={4}
                    >
                      No secrets found.
                    </td>
                  </tr>
                )
                : secrets.map((secret) => {
                  const confirmMessage = `Delete secret ${secret.name}?`;
                  return (
                    <tr class={responsiveRowClass}>
                      <td class={`${cellClass} ${responsiveCellClass}`}>
                        {secret.name}
                      </td>
                      <td class={`${cellClass} ${responsiveCellClass}`}>
                        {secret.shortId}
                      </td>
                      <td class={`${cellClass} ${responsiveCellClass}`}>
                        {secret.createdAt}
                      </td>
                      <td class={`${cellClass} ${responsiveCellClass}`}>
                        <form
                          method="post"
                          action="/delete"
                          data-confirm-message={confirmMessage}
                          onSubmit={(event) => {
                            const target = event.currentTarget as {
                              dataset?: Record<string, string>;
                            };
                            const message = target.dataset?.confirmMessage ||
                              "Delete secret?";
                            if (!confirm(message)) {
                              event.preventDefault();
                            }
                          }}
                        >
                          <input type="hidden" name="id" value={secret.id} />
                          <input
                            type="hidden"
                            name="name"
                            value={secret.name}
                          />
                          <button
                            class={`${buttonClass} ${dangerButtonClass}`}
                            type="submit"
                          >
                            Delete
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};
