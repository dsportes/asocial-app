<template>
  <div class="q-pa-sm full-width">
    <div v-if="session.estComptable">
      <div class="titre-lg text-italic">{{$t('PCRtkatt2')}}</div>
    </div>

    <div v-if="aSt.compta.estA" class="q-pa-xs">
      <div class="titre-lg text-italic q-my-md">{{$t('PCRtkatt')}}</div>

      <q-btn dense size="md" icon="add" color="primary" :label="$t('PCRgen')"
        @click="nvTicket"/>

      <div v-for="(tk, idx) in aSt.compta.credits.tickets" :key="tk"
        :class="dkli(idx) + 'q-my-xs row items-center'">
        <span class="font-mono q-mr-xs">{{session.org}}</span>
        <span class="font-mono q-mr-xs">{{(''+tk).substring(0, 8)}}</span>
        <span class="font-mono q-mr-xs">{{(''+tk).substring(8, 12)}}</span>
        <span class="font-mono q-mr-lg">{{(''+tk).substring(12, 12)}}</span>
        <q-btn dense size="sm" icon="close" color="negative" @click="del(tk)"/>
      </div>
    </div>

  <q-dialog v-model="confirmdel">
    <q-card class="bs">
      <q-card-section class="q-pa-md fs-md text-center">
        {{$t('PCPdel')}}</q-card-section>
      <q-card-actions align="right">
        <q-btn flat :label="$t('renoncer')" color="primary" @click="MD.fD"/>
        <q-btn flat :label="$t('PCdel2')" color="warning" @click="deltk2"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

  </div>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import { dhcool, mon, dkli, $t, afficherDiag } from '../app/util.mjs'
import { GenererRefCredit, DeleteRefCredit } from '../app/operations.mjs'
import { MD } from '../app/modele.mjs'

export default ({
  name: 'PanelCredits',

  props: { },

  components: { },

  computed: {
  },

  data () {
    return {
      tk: 0
    }
  },

  methods: {
    async nvTicket () {
      if (!await this.session.editUrgence()) return
      this.tk = await new GenererRefCredit().run()
      await afficherDiag($t('PCRref'), [this.session.org, this.tk])
    },
    async del (tk) {
      if (!await this.session.editUrgence()) return
      this.tk = tk
      this.ovconfirmdel()
    },
    async deltk2 () {
      MD.fD()
      await new DeleteRefCredit().run(this.tk)
    }
  },

  setup () {
    const session = stores.session
    const aSt = stores.avatar
    const compta = aSt.compta

    const confirmdel = ref(false)
    function ovconfirmdel () { MD.oD(confirmdel)}

    return {
      aSt, session,
      confirmdel, ovconfirmdel,
      MD, mon, dhcool, dkli
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bordb
  border-bottom: 1px solid $grey-5
</style>
