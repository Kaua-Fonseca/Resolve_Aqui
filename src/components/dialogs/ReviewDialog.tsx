'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { api } from '@/lib/api'

export function ReviewDialog({ target, close }: { target: { id: string; name: string }; close: () => void }) {
  const [sent, setSent] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async () => {
    if (!rating) {
      setError('Escolha uma nota de 1 a 5 estrelas.')
      return
    }
    if (comment.trim().length < 5) {
      setError('Escreva um comentário com pelo menos 5 caracteres.')
      return
    }
    setBusy(true)
    setError('')
    const r = await api('/api/account/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ professionalId: target.id, rating, comment }),
    })
    setBusy(false)
    if (!r.ok) {
      setError(r.data?.error?.message || 'Não foi possível enviar a avaliação.')
      return
    }
    setSent(true)
  }
  return (
    <div className="dialog-backdrop" onClick={close}>
      <section className="access-dialog review-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="dialog-close" onClick={close}>
          <Icon name="close" />
        </button>
        {sent ? (
          <>
            <div className="dialog-icon success">
              <Icon name="check" size={28} />
            </div>
            <h2>Avaliação enviada!</h2>
            <p>Obrigado! Sua avaliação será publicada após a análise da nossa equipe.</p>
            <Button onClick={close}>Concluir</Button>
          </>
        ) : (
          <>
            <span className="overline">AVALIAR PROFISSIONAL</span>
            <h2>Como foi o serviço de {target.name.split(' ')[0]}?</h2>
            <div className="review-stars">
              {[1, 2, 3, 4, 5].map((x) => (
                <button key={x} type="button" onClick={() => setRating(x)} aria-label={`${x} estrelas`}>
                  {x <= rating ? '★' : '☆'}
                </button>
              ))}
            </div>
            <label className="review-comment">
              Seu comentário
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={2000}
                placeholder="Conte como foi sua experiência, a qualidade e o atendimento..."
              />
            </label>
            {error && (
              <p role="alert" style={{ color: '#b91c1c', fontSize: 13 }}>
                {error}
              </p>
            )}
            <Button className="full" disabled={busy} onClick={submit}>
              {busy ? 'Enviando...' : 'Enviar avaliação'}
            </Button>
          </>
        )}
      </section>
    </div>
  )
}
