// src/services/multi-provider.service.ts
/**
 * 🚀 MULTI-PROVIDER SERVICE PARA GROQ API
 * 
 * Sistema de balanceamento inteligente entre múltiplos modelos Groq
 * para aumentar capacidade de TPM sem custos adicionais.
 * 
 * Capacidade Total: 14k TPM (6k + 8k)
 * Suporte: 5-8 usuários simultâneos
 */

interface GroqModel {
    name: string;
    tpmLimit: number;
    rpmLimit: number;
    quality: 'high' | 'medium';
    preferredFor: string[];
  }
  
  interface ProviderMetrics {
    requestsInCurrentMinute: number;
    tokensInCurrentMinute: number;
    lastRequestTime: number;
    minuteWindowStart: number;
    totalRequests: number;
    totalTokens: number;
    errorCount: number;
    averageResponseTime: number;
  }
  
  interface ProviderStatus {
    isAvailable: boolean;
    nextAvailableTime: number;
    currentLoad: number; // 0-1 (percentage)
    consecutiveErrors: number;
  }
  
  export class MultiProviderService {
    // 🚀 CONFIGURAÇÃO DOS MODELOS GROQ
    private static readonly MODELS: Record<string, GroqModel> = {
      'llama-3.1-8b-instant': {
        name: 'llama-3.1-8b-instant',
        tpmLimit: 6000,
        rpmLimit: 30,
        quality: 'high',
        preferredFor: ['resumo', 'timeline', 'partes']
      },
      'openai/gpt-oss-120b': {
        name: 'openai/gpt-oss-120b',
        tpmLimit: 8000,
        rpmLimit: 30,
        quality: 'high',
        preferredFor: ['decisoes', 'estrategia', 'completa']
      }
    };
  
    // 🚀 CONFIGURAÇÕES GLOBAIS
    private static readonly CONFIG = {
      GROQ_API_URL: 'https://api.groq.com/openai/v1/chat/completions',
      MAX_RETRIES: 3,
      BASE_DELAY: 2000,
      MAX_DELAY: 30000,
      BACKOFF_MULTIPLIER: 2,
      ERROR_THRESHOLD: 5, // Máximo de erros consecutivos antes de desabilitar
      RECOVERY_TIME: 300000, // 5 minutos para tentar reativar provider com erro
      LOAD_BALANCE_STRATEGY: 'round_robin' as 'round_robin' | 'least_loaded' | 'preferred'
    };
  
    // 🚀 MÉTRICAS E STATUS POR PROVIDER
    private static metrics: Record<string, ProviderMetrics> = {};
    private static status: Record<string, ProviderStatus> = {};
    private static lastUsedProvider = 0; // Para round-robin
  
    // 🚀 INICIALIZAÇÃO DOS PROVIDERS
    static {
      Object.keys(this.MODELS).forEach(modelName => {
        this.metrics[modelName] = {
          requestsInCurrentMinute: 0,
          tokensInCurrentMinute: 0,
          lastRequestTime: 0,
          minuteWindowStart: Date.now(),
          totalRequests: 0,
          totalTokens: 0,
          errorCount: 0,
          averageResponseTime: 0
        };
        
        this.status[modelName] = {
          isAvailable: true,
          nextAvailableTime: 0,
          currentLoad: 0,
          consecutiveErrors: 0
        };
      });
    }
  
    /**
     * 🚀 MÉTODO PRINCIPAL: Faz request com balanceamento automático
     */
    static async makeRequest(//eslint-disable-next-line
      requestBody: any, 
      estimatedTokens: number,
      analysisType?: string
    ): Promise<Response> {
      const startTime = Date.now();
      
      // Atualizar métricas de todos os providers
      this.updateAllMetrics();
      
      // Selecionar melhor provider
      const selectedModel = this.selectBestProvider(estimatedTokens, analysisType);
      
      if (!selectedModel) {
        throw new Error('Nenhum provider disponível no momento. Tente novamente em alguns minutos.');
      }
  
      console.log(`🎯 Selecionado: ${selectedModel} para ${estimatedTokens} tokens`);
  
      // Aplicar rate limiting específico do provider
      await this.enforceProviderRateLimit(selectedModel, estimatedTokens);
  
      // Fazer a requisição com retry
      const response = await this.makeRequestWithRetry(selectedModel, requestBody, estimatedTokens, startTime);
      
      // Atualizar métricas de sucesso
      this.updateSuccessMetrics(selectedModel, estimatedTokens, startTime);
      
      return response;
    }
  
    /**
     * 🧠 SELEÇÃO INTELIGENTE DE PROVIDER
     */
    private static selectBestProvider(estimatedTokens: number, analysisType?: string): string | null {
      const availableModels = Object.keys(this.MODELS).filter(model => 
        this.isProviderAvailable(model, estimatedTokens)
      );
  
      if (availableModels.length === 0) {
        // Tentar recuperar providers com erro se já passou tempo suficiente
        this.attemptProviderRecovery();
        return null;
      }
  
      // Estratégia de seleção baseada na configuração
      switch (this.CONFIG.LOAD_BALANCE_STRATEGY) {
        case 'preferred':
          return this.selectByPreference(availableModels, analysisType);
        
        case 'least_loaded':
          return this.selectLeastLoaded(availableModels);
        
        case 'round_robin':
        default:
          return this.selectRoundRobin(availableModels);
      }
    }
  
    /**
     * 🎯 SELEÇÃO POR PREFERÊNCIA (baseado no tipo de análise)
     */
    private static selectByPreference(availableModels: string[], analysisType?: string): string {
      if (!analysisType) {
        return this.selectRoundRobin(availableModels);
      }
  
      // Buscar modelo preferido para este tipo de análise
      const preferredModel = availableModels.find(model => 
        this.MODELS[model].preferredFor.includes(analysisType)
      );
  
      if (preferredModel && this.status[preferredModel].currentLoad < 0.8) {
        return preferredModel;
      }
  
      // Fallback para least loaded
      return this.selectLeastLoaded(availableModels);
    }
  
    /**
     * ⚖️ SELEÇÃO POR MENOR CARGA
     */
    private static selectLeastLoaded(availableModels: string[]): string {
      return availableModels.reduce((best, current) => {
        const currentLoad = this.status[current].currentLoad;
        const bestLoad = this.status[best].currentLoad;
        return currentLoad < bestLoad ? current : best;
      });
    }
  
    /**
     * 🔄 SELEÇÃO ROUND-ROBIN
     */
    private static selectRoundRobin(availableModels: string[]): string {
      this.lastUsedProvider = (this.lastUsedProvider + 1) % availableModels.length;
      return availableModels[this.lastUsedProvider];
    }
  
    /**
     * ✅ VERIFICAR SE PROVIDER ESTÁ DISPONÍVEL
     */
    private static isProviderAvailable(modelName: string, estimatedTokens: number): boolean {
      const status = this.status[modelName];
      const metrics = this.metrics[modelName];
      const model = this.MODELS[modelName];
  
      // Verificar se não está em recuperação
      if (!status.isAvailable && Date.now() < status.nextAvailableTime) {
        return false;
      }
  
      // Verificar limites de TPM
      if (metrics.tokensInCurrentMinute + estimatedTokens > model.tpmLimit) {
        return false;
      }
  
      // Verificar limites de RPM
      if (metrics.requestsInCurrentMinute >= model.rpmLimit) {
        return false;
      }
  
      return true;
    }
  
    /**
     * ⏰ APLICAR RATE LIMITING POR PROVIDER
     */
    private static async enforceProviderRateLimit(modelName: string, estimatedTokens: number): Promise<void> {
      const metrics = this.metrics[modelName];
      const model = this.MODELS[modelName];
      const now = Date.now();
  
      // Reset janela se passou 1 minuto
      if (now - metrics.minuteWindowStart > 60000) {
        metrics.requestsInCurrentMinute = 0;
        metrics.tokensInCurrentMinute = 0;
        metrics.minuteWindowStart = now;
      }
  
      // Calcular delay necessário baseado no último request
      const timeSinceLastRequest = now - metrics.lastRequestTime;
      const minimumDelay = Math.max(0, 60000 / model.rpmLimit); // Espaçamento mínimo entre requests
  
      if (timeSinceLastRequest < minimumDelay) {
        const delayNeeded = minimumDelay - timeSinceLastRequest;
        console.log(`⏳ Rate limiting ${modelName}: aguardando ${Math.round(delayNeeded/1000)}s`);
        await this.delay(delayNeeded);
      }
  
      // Atualizar métricas antes do request
      metrics.requestsInCurrentMinute++;
      metrics.tokensInCurrentMinute += estimatedTokens;
      metrics.lastRequestTime = Date.now();
      
      // Atualizar carga atual (0-1)
      this.status[modelName].currentLoad = Math.max(
        metrics.tokensInCurrentMinute / model.tpmLimit,
        metrics.requestsInCurrentMinute / model.rpmLimit
      );
    }
  
    /**
     * 🔄 FAZER REQUEST COM RETRY E FALLBACK
     */
    private static async makeRequestWithRetry(
      modelName: string, //eslint-disable-next-line
      requestBody: any, 
      estimatedTokens: number,//eslint-disable-next-line
      startTime: number
    ): Promise<Response> {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        throw new Error('GROQ_API_KEY não configurada');
      }
  
      // Preparar request body com o modelo específico
      const finalRequestBody = {
        ...requestBody,
        model: modelName
      };
  
      let lastError: Error | null = null;
  
      for (let attempt = 1; attempt <= this.CONFIG.MAX_RETRIES; attempt++) {
        try {
          console.log(`🔄 ${modelName} - Tentativa ${attempt}/${this.CONFIG.MAX_RETRIES}`);
          
          const response = await fetch(this.CONFIG.GROQ_API_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(finalRequestBody)
          });
  
          if (response.ok) {
            console.log(`✅ ${modelName} - Sucesso na tentativa ${attempt}`);
            
            // Reset contador de erros consecutivos
            this.status[modelName].consecutiveErrors = 0;
            this.status[modelName].isAvailable = true;
            
            return response;
          }
  
          // Tratar diferentes tipos de erro
          if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            const delay = retryAfter ? parseInt(retryAfter) * 1000 : 
                         Math.min(this.CONFIG.BASE_DELAY * Math.pow(this.CONFIG.BACKOFF_MULTIPLIER, attempt - 1), this.CONFIG.MAX_DELAY);
            
            console.log(`⏳ ${modelName} - Rate limit (429). Aguardando ${Math.round(delay/1000)}s...`);
            
            if (attempt === this.CONFIG.MAX_RETRIES) {
              // Se é a última tentativa, tentar outro provider
              return await this.fallbackToAnotherProvider(finalRequestBody, estimatedTokens, modelName);
            }
            
            await this.delay(delay);
            continue;
          }
  
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  
        } catch (error) {
          lastError = error as Error;
          console.error(`❌ ${modelName} - Erro na tentativa ${attempt}:`, error);
          
          // Incrementar contador de erros
          this.updateErrorMetrics(modelName);
          
          if (attempt === this.CONFIG.MAX_RETRIES) {
            // Última tentativa - tentar outro provider
            try {
              return await this.fallbackToAnotherProvider(finalRequestBody, estimatedTokens, modelName);
            } catch (fallbackError) {
              console.error(`❌ Fallback também falhou:`, fallbackError);
              throw lastError;
            }
          }
          
          // Backoff exponencial
          const delay = Math.min(
            this.CONFIG.BASE_DELAY * Math.pow(this.CONFIG.BACKOFF_MULTIPLIER, attempt - 1), 
            this.CONFIG.MAX_DELAY
          );
          console.log(`⏳ Aguardando ${Math.round(delay/1000)}s antes da próxima tentativa...`);
          await this.delay(delay);
        }
      }
  
      throw lastError || new Error('Falha completa após todas as tentativas');
    }
  
    /**
     * 🆘 FALLBACK PARA OUTRO PROVIDER
     */
    private static async fallbackToAnotherProvider(//eslint-disable-next-line
      requestBody: any, 
      estimatedTokens: number, 
      excludeModel: string
    ): Promise<Response> {
      console.log(`🆘 Tentando fallback - excluindo ${excludeModel}`);
      
      const availableModels = Object.keys(this.MODELS).filter(model => 
        model !== excludeModel && this.isProviderAvailable(model, estimatedTokens)
      );
  
      if (availableModels.length === 0) {
        throw new Error('Nenhum provider disponível para fallback');
      }
  
      const fallbackModel = this.selectLeastLoaded(availableModels);
      console.log(`🔄 Fallback para: ${fallbackModel}`);
      
      // Aplicar rate limiting do provider de fallback
      await this.enforceProviderRateLimit(fallbackModel, estimatedTokens);
      
      // Fazer request com o provider de fallback (sem retry - já é um fallback)
      const apiKey = process.env.GROQ_API_KEY;
      const response = await fetch(this.CONFIG.GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...requestBody,
          model: fallbackModel
        })
      });
  
      if (!response.ok) {
        throw new Error(`Fallback falhou: HTTP ${response.status}`);
      }
  
      // Atualizar métricas do provider de fallback
      this.updateSuccessMetrics(fallbackModel, estimatedTokens, Date.now());
      
      return response;
    }
  
    /**
     * 📊 ATUALIZAR MÉTRICAS DE SUCESSO
     */
    private static updateSuccessMetrics(modelName: string, tokensUsed: number, startTime: number): void {
      const metrics = this.metrics[modelName];
      const responseTime = Date.now() - startTime;
      
      metrics.totalRequests++;
      metrics.totalTokens += tokensUsed;
      
      // Calcular média móvel do tempo de resposta
      const alpha = 0.1; // Fator de suavização
      metrics.averageResponseTime = metrics.averageResponseTime === 0 ? 
        responseTime : 
        (alpha * responseTime) + ((1 - alpha) * metrics.averageResponseTime);
    }
  
    /**
     * ❌ ATUALIZAR MÉTRICAS DE ERRO
     */
    private static updateErrorMetrics(modelName: string): void {
      const status = this.status[modelName];
      const metrics = this.metrics[modelName];
      
      status.consecutiveErrors++;
      metrics.errorCount++;
      
      // Se muitos erros consecutivos, desabilitar temporariamente
      if (status.consecutiveErrors >= this.CONFIG.ERROR_THRESHOLD) {
        status.isAvailable = false;
        status.nextAvailableTime = Date.now() + this.CONFIG.RECOVERY_TIME;
        
        console.warn(`⚠️ Provider ${modelName} temporariamente desabilitado após ${status.consecutiveErrors} erros consecutivos`);
      }
    }
  
    /**
     * 🔄 ATUALIZAR TODAS AS MÉTRICAS
     */
    private static updateAllMetrics(): void {
      const now = Date.now();
      
      Object.keys(this.MODELS).forEach(modelName => {
        const metrics = this.metrics[modelName];
        const status = this.status[modelName];
        
        // Reset janela se passou 1 minuto
        if (now - metrics.minuteWindowStart > 60000) {
          metrics.requestsInCurrentMinute = 0;
          metrics.tokensInCurrentMinute = 0;
          metrics.minuteWindowStart = now;
        }
        
        // Recalcular carga atual
        const model = this.MODELS[modelName];
        status.currentLoad = Math.max(
          metrics.tokensInCurrentMinute / model.tpmLimit,
          metrics.requestsInCurrentMinute / model.rpmLimit
        );
      });
    }
  
    /**
     * 🔧 TENTAR RECUPERAR PROVIDERS COM ERRO
     */
    private static attemptProviderRecovery(): void {
      const now = Date.now();
      
      Object.keys(this.MODELS).forEach(modelName => {
        const status = this.status[modelName];
        
        if (!status.isAvailable && now >= status.nextAvailableTime) {
          console.log(`🔧 Tentando recuperar provider: ${modelName}`);
          status.isAvailable = true;
          status.consecutiveErrors = 0;
        }
      });
    }
  
    /**
     * ⏰ DELAY HELPER
     */
    private static delay(ms: number): Promise<void> {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  
    /**
     * 📈 OBTER ESTATÍSTICAS DOS PROVIDERS
     */
    static getProviderStats(): Record<string, {
      model: GroqModel;
      metrics: ProviderMetrics;
      status: ProviderStatus;
      capacityUsed: {
        tpm: string;
        rpm: string;
      };
    }> {
      this.updateAllMetrics();
      //eslint-disable-next-line
      const stats: Record<string, any> = {};
      
      Object.keys(this.MODELS).forEach(modelName => {
        const model = this.MODELS[modelName];
        const metrics = this.metrics[modelName];
        const status = this.status[modelName];
        
        stats[modelName] = {
          model,
          metrics,
          status,
          capacityUsed: {
            tpm: `${metrics.tokensInCurrentMinute}/${model.tpmLimit} (${Math.round(status.currentLoad * 100)}%)`,
            rpm: `${metrics.requestsInCurrentMinute}/${model.rpmLimit}`
          }
        };
      });
      
      return stats;
    }
  
    /**
     * 📊 OBTER CAPACIDADE TOTAL DISPONÍVEL
     */
    static getTotalCapacity(): {
      totalTPM: number;
      availableTPM: number;
      totalRPM: number;
      availableRPM: number;
      activeProviders: number;
    } {
      this.updateAllMetrics();
      
      let totalTPM = 0;
      let availableTPM = 0;
      let totalRPM = 0;
      let availableRPM = 0;
      let activeProviders = 0;
      
      Object.keys(this.MODELS).forEach(modelName => {
        const model = this.MODELS[modelName];
        const metrics = this.metrics[modelName];
        const status = this.status[modelName];
        
        totalTPM += model.tpmLimit;
        totalRPM += model.rpmLimit;
        
        if (status.isAvailable) {
          activeProviders++;
          availableTPM += (model.tpmLimit - metrics.tokensInCurrentMinute);
          availableRPM += (model.rpmLimit - metrics.requestsInCurrentMinute);
        }
      });
      
      return {
        totalTPM,
        availableTPM: Math.max(0, availableTPM),
        totalRPM,
        availableRPM: Math.max(0, availableRPM),
        activeProviders
      };
    }
  
    /**
     * 🔄 RESET MANUAL DAS MÉTRICAS (para debug/admin)
     */
    static resetMetrics(): void {
      Object.keys(this.MODELS).forEach(modelName => {
        this.metrics[modelName] = {
          requestsInCurrentMinute: 0,
          tokensInCurrentMinute: 0,
          lastRequestTime: 0,
          minuteWindowStart: Date.now(),
          totalRequests: 0,
          totalTokens: 0,
          errorCount: 0,
          averageResponseTime: 0
        };
        
        this.status[modelName] = {
          isAvailable: true,
          nextAvailableTime: 0,
          currentLoad: 0,
          consecutiveErrors: 0
        };
      });
      
      console.log('✅ Métricas do MultiProviderService resetadas');
    }
  }