import Header from "./HeaderSection";
import Footer from "./Footer";
export default function Maintenance() {
    return (
        <>
                <Header />
                <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 py-16 px-4 sm:px-6 lg:px-8">
                  <div className="max-w-3xl mx-auto text-center">
                    <div className="space-y-8">
                      <div className="mx-auto w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
                        <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      
                      <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl">
                        Em Manutenção
                      </h1>
                      
                      <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                        Estamos fazendo algumas melhorias em nosso site. 
                        Voltaremos em breve com novidades incríveis!
                      </p>
          
                      <div className="mt-6">
                        <div className="inline-flex items-center px-4 py-2 bg-green-100 rounded-full text-green-700">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-green-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Trabalho em Progresso
                        </div>
                      </div>
          
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                          <div className="text-green-500 mb-4">
                            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium text-gray-900">Atualizações</h3>
                          <p className="mt-2 text-sm text-gray-500">Implementando melhorias de performance</p>
                        </div>
          
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                          <div className="text-green-500 mb-4">
                            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium text-gray-900">Segurança</h3>
                          <p className="mt-2 text-sm text-gray-500">Reforçando nossa proteção</p>
                        </div>
          
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                          <div className="text-green-500 mb-4">
                            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium text-gray-900">Novidades</h3>
                          <p className="mt-2 text-sm text-gray-500">Preparando recursos incríveis</p>
                        </div>
                      </div>
          
                      <div className="mt-10">
                        {/* <div className="max-w-xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
                          <div className="p-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">
                              Tempo Estimado
                            </h2>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div className="bg-green-600 h-2.5 rounded-full w-2/3 animate-pulse"></div>
                            </div>
                            <p className="mt-4 text-sm text-gray-500">
                              Estamos trabalhando para voltar o mais rápido possível
                            </p>
                          </div>
                        </div> */}
                      </div>
                    </div>
                  </div>
                </div>
                <Footer />
              </>
    )
}