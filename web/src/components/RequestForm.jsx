import { useState } from 'react';

const exampleText = 'Family of 5 at Lake Road needs food and medicine urgently. One child is sick.';

export default function RequestForm({ onSubmit }) {
  const [value, setValue] = useState(exampleText);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!value.trim()) {
      return;
    }
    onSubmit(value.trim());
    setValue('');
  };

  return (
    <section className="panel request-form">
      <h2>Request intake</h2>
      <p className="helper-text">
        Start with free-text input now. The team can later swap the mock extractor with Gemini / Vertex AI.
      </p>
      <form onSubmit={handleSubmit}>
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Describe the relief request..."
        />
        <div className="request-actions">
          <button className="primary-button" type="submit">
            Submit request
          </button>
          <button className="secondary-button" type="button" onClick={() => setValue(exampleText)}>
            Load sample
          </button>
        </div>
      </form>
    </section>
  );
}
