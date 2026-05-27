export type ContactMailTemplateProps = {
  name: string
  email: string
  phone?: string
  message: string
}

export function ContactEmailTemplate({ name, email, phone, message }: ContactMailTemplateProps) {
  return (
    <html>
      <head>
        <meta
          httpEquiv='Content-Type'
          content='text/html; charset=UTF-8'
        />
        <meta
          name='viewport'
          content='width=device-width, initial-scale=1.0'
        />
        <title>Neue Kontaktanfrage</title>
        {/* Conditional comment for MSO */}
        <style
          type='text/css'
          dangerouslySetInnerHTML={{
            __html: `
            <!--[if mso]>
            table { border-collapse: collapse; }
            .fallback-font { font-family: Arial, sans-serif !important; }
            <![endif]-->
          `,
          }}
        />
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#f4f4f4', fontFamily: 'Arial, Helvetica, sans-serif' }}>
        {/* Wrapper Table für maximale Kompatibilität */}
        <table
          role='presentation'
          cellSpacing='0'
          cellPadding='0'
          border={0}
          width='100%'
          style={{ backgroundColor: '#f4f4f4' }}
        >
          <tbody>
            <tr>
              <td
                align='center'
                style={{ padding: '20px 0' }}
              >
                {/* Haupt-Container */}
                <table
                  role='presentation'
                  cellSpacing='0'
                  cellPadding='0'
                  border={0}
                  width='600'
                  style={{
                    width: '600px',
                    maxWidth: '600px',
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  }}
                >
                  <tbody>
                    {/* Header */}
                    <tr>
                      <td
                        align='center'
                        style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          backgroundColor: '#667eea',
                          padding: '30px 20px',
                          color: '#ffffff',
                        }}
                      >
                        <h1
                          style={{
                            margin: 0,
                            fontSize: '24px',
                            fontWeight: 600,
                            fontFamily: 'Arial, Helvetica, sans-serif',
                            color: '#ffffff',
                          }}
                        >
                          📧 Neue Kontaktanfrage
                        </h1>
                        <p
                          style={{
                            margin: '10px 0 0 0',
                            fontSize: '14px',
                            color: '#ffffff',
                            opacity: 0.9,
                            fontFamily: 'Arial, Helvetica, sans-serif',
                          }}
                        >
                          Über Ihr Website-Kontaktformular eingegangen
                        </p>
                      </td>
                    </tr>

                    {/* Content Area */}
                    <tr>
                      <td style={{ padding: '30px 20px' }}>
                        {/* Highlight Box */}
                        <table
                          role='presentation'
                          cellSpacing='0'
                          cellPadding='0'
                          border={0}
                          width='100%'
                          style={{ marginBottom: '25px' }}
                        >
                          <tbody>
                            <tr>
                              <td
                                style={{
                                  backgroundColor: '#fff3cd',
                                  border: '1px solid #ffeaa7',
                                  borderRadius: '4px',
                                  padding: '15px',
                                }}
                              >
                                <p
                                  style={{
                                    margin: 0,
                                    fontFamily: 'Arial, Helvetica, sans-serif',
                                    fontSize: '14px',
                                    color: '#333333',
                                  }}
                                >
                                  <strong>Neue Nachricht erhalten!</strong> Jemand hat Ihr Kontaktformular ausgefüllt.
                                </p>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Kontakt Info Row */}
                        <table
                          role='presentation'
                          cellSpacing='0'
                          cellPadding='0'
                          border={0}
                          width='100%'
                          style={{ marginBottom: '25px' }}
                        >
                          <tbody>
                            <tr>
                              {/* Name Field */}
                              <td
                                width='48%'
                                style={{ verticalAlign: 'top', paddingRight: '10px' }}
                              >
                                <table
                                  role='presentation'
                                  cellSpacing='0'
                                  cellPadding='0'
                                  border={0}
                                  width='100%'
                                >
                                  <tbody>
                                    <tr>
                                      <td style={{ borderLeft: '4px solid #667eea', paddingLeft: '15px' }}>
                                        <p
                                          style={{
                                            margin: '0 0 5px 0',
                                            fontFamily: 'Arial, Helvetica, sans-serif',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            color: '#555555',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                          }}
                                        >
                                          👤 Name
                                        </p>
                                        <p
                                          style={{
                                            margin: 0,
                                            fontFamily: 'Arial, Helvetica, sans-serif',
                                            fontSize: '16px',
                                            color: '#333333',
                                            wordBreak: 'break-word',
                                          }}
                                        >
                                          {name || 'Nicht angegeben'}
                                        </p>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>

                              {/* Email Field */}
                              <td
                                width='48%'
                                style={{ verticalAlign: 'top', paddingLeft: '10px' }}
                              >
                                <table
                                  role='presentation'
                                  cellSpacing='0'
                                  cellPadding='0'
                                  border={0}
                                  width='100%'
                                >
                                  <tbody>
                                    <tr>
                                      <td style={{ borderLeft: '4px solid #667eea', paddingLeft: '15px' }}>
                                        <p
                                          style={{
                                            margin: '0 0 5px 0',
                                            fontFamily: 'Arial, Helvetica, sans-serif',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            color: '#555555',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                          }}
                                        >
                                          📧 E-Mail
                                        </p>
                                        <p
                                          style={{
                                            margin: 0,
                                            fontFamily: 'Arial, Helvetica, sans-serif',
                                            fontSize: '16px',
                                            color: '#333333',
                                            wordBreak: 'break-word',
                                          }}
                                        >
                                          {email ? (
                                            <a
                                              href={`mailto:${email}`}
                                              style={{ color: '#667eea', textDecoration: 'none' }}
                                            >
                                              {email}
                                            </a>
                                          ) : (
                                            <em style={{ color: '#6c757d' }}>Nicht angegeben</em>
                                          )}
                                        </p>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Phone Field */}
                        <table
                          role='presentation'
                          cellSpacing='0'
                          cellPadding='0'
                          border={0}
                          width='100%'
                          style={{ marginBottom: '25px' }}
                        >
                          <tbody>
                            <tr>
                              <td style={{ borderLeft: '4px solid #667eea', paddingLeft: '15px' }}>
                                <p
                                  style={{
                                    margin: '0 0 5px 0',
                                    fontFamily: 'Arial, Helvetica, sans-serif',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: '#555555',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                  }}
                                >
                                  📞 Telefon
                                </p>
                                <p
                                  style={{
                                    margin: 0,
                                    fontFamily: 'Arial, Helvetica, sans-serif',
                                    fontSize: '16px',
                                    color: '#333333',
                                    wordBreak: 'break-word',
                                  }}
                                >
                                  {phone ? (
                                    <a
                                      href={`tel:${phone}`}
                                      style={{ color: '#667eea', textDecoration: 'none' }}
                                    >
                                      {phone}
                                    </a>
                                  ) : (
                                    <em style={{ color: '#6c757d' }}>Nicht angegeben</em>
                                  )}
                                </p>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Message Field */}
                        <table
                          role='presentation'
                          cellSpacing='0'
                          cellPadding='0'
                          border={0}
                          width='100%'
                          style={{ marginBottom: '25px' }}
                        >
                          <tbody>
                            <tr>
                              <td style={{ borderLeft: '4px solid #667eea', paddingLeft: '15px' }}>
                                <p
                                  style={{
                                    margin: '0 0 8px 0',
                                    fontFamily: 'Arial, Helvetica, sans-serif',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: '#555555',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                  }}
                                >
                                  💬 Nachricht
                                </p>
                                <table
                                  role='presentation'
                                  cellSpacing='0'
                                  cellPadding='0'
                                  border={0}
                                  width='100%'
                                >
                                  <tbody>
                                    <tr>
                                      <td
                                        style={{
                                          backgroundColor: '#f8f9fa',
                                          borderRadius: '6px',
                                          padding: '15px',
                                          border: '1px solid #e9ecef',
                                        }}
                                      >
                                        <p
                                          style={{
                                            margin: 0,
                                            fontFamily: 'Arial, Helvetica, sans-serif',
                                            fontSize: '16px',
                                            color: '#333333',
                                            lineHeight: 1.5,
                                            whiteSpace: 'pre-wrap',
                                          }}
                                        >
                                          {message ? (
                                            <span
                                              dangerouslySetInnerHTML={{ __html: message.replace(/\n/g, '<br />') }}
                                            />
                                          ) : (
                                            <em style={{ color: '#6c757d' }}>Keine Nachricht hinterlassen</em>
                                          )}
                                        </p>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
                {/* Ende Haupt-Container */}
              </td>
            </tr>
          </tbody>
        </table>
        {/* Ende Wrapper Table */}
      </body>
    </html>
  )
}
