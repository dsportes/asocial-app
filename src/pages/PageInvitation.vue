<template>
  <q-page class="column q-pl-xs q-mr-sm spmd" style="padding-top:5em">
    <div v-if="pSt.map.size && !pSt.peLpF" class="q-my-md titre-lg text-italic">
      {{$t('APnb', [pSt.map.size])}}
    </div>
    
    <div v-if="pSt.peLpF.length">
      <q-card class="q-my-md column justify-center" v-for="(p, idx) in pSt.peLpF" :key="p.id">
        <apercu-genx class="q-pa-xs" :id="p.id" :idx="idx" nodet/>
        <div v-if="p.d > 3" class="texte-italic fs-md">{{$t('PPctc' + p.d)}}</div>
        <div class="text-center"><btn-cond cond="cEdit" icon="check" color="green-5" :label="$t('PPctcok')"
          @ok="select(p)"/></div>
      </q-card>
    </div>

    <q-page-sticky v-if="session.accesNet && !session.estA" position="top" 
      :offset="[0, 0]">
      <div class="row bg-secondary text-white justify-between" style="width:100vw">
        <btn-cond :label="$t('renoncer')" @ok="ui.setPage('groupe', 'groupe')"/>
        <q-checkbox v-model="propos" :label="$t('PIfi')" />
        <btn-cond :label="$t('CVraf')" @ok="rafCvs"/>
      </div>
    </q-page-sticky>
  </q-page>
</template>

<script>

import stores from '../stores/stores.mjs'
import ApercuGenx from '../components/ApercuGenx.vue'
import BtnCond from '../components/BtnCond.vue'
import { RafraichirCvsAv } from '../app/operations4.mjs'

export default {
  name: 'PageInvitation',

  components: { ApercuGenx, BtnCond },

  computed: {
    lst () { const src = this.pSt.peLpF; const l = []
      src.forEach(x => {
        const y = { ...x }
        y.d = this.gSt.diagContact(x.id)
        if (!y.d || this.propos) l.push(y)
      })
      return l
    }
  },

  methods: {
    async rafCvs () {
      let nc = 0, nv = 0
      for (const id of this.session.compte.mav) {
        const [x, y] = await new RafraichirCvsAv().run(id)
        nc += x; nv += y
      }
      stores.ui.afficherMessage(this.$t('CVraf2', [nc, nv]), false)
    }, 
    select () {
      this.ui.setPage('groupe', 'groupe')
    }
  },

  data () {
    return {
      propos: true,
    }
  },

  setup () {
    return {
      session: stores.session,
      ui: stores.ui,
      pSt: stores.people,
      gSt: stores.groupe
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
