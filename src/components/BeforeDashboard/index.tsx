import { Banner } from '@payloadcms/ui'
import React from 'react'

import { SeedButton } from './SeedButton'

export const BeforeDashboard: React.FC = () => {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <Banner type="success">
        <h4 style={{ margin: 0 }}>Добро пожаловать в панель управления FLEUR!</h4>
      </Banner>
      <p style={{ marginTop: '1rem' }}>Что делать дальше:</p>
      <ol style={{ listStyle: 'decimal', paddingLeft: '1.5rem' }}>
        <li>
          <SeedButton />
          {' — заполните базу тестовыми данными, затем '}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/">перейдите на сайт</a>
          {' чтобы увидеть результат.'}
        </li>
        <li>
          {'Оплата будет подключена через ЮKassa. Настройте '}
          <strong>YOOKASSA_SHOP_ID</strong>
          {' и '}
          <strong>YOOKASSA_SECRET_KEY</strong>
          {' в переменных окружения.'}
        </li>
        <li>
          {'Настройте '}
          <a
            href="https://payloadcms.com/docs/configuration/collections"
            rel="noopener noreferrer"
            target="_blank"
          >
            коллекции
          </a>
          {' и добавьте '}
          <a
            href="https://payloadcms.com/docs/fields/overview"
            rel="noopener noreferrer"
            target="_blank"
          >
            поля
          </a>
          {' по необходимости.'}
        </li>
      </ol>
    </div>
  )
}
