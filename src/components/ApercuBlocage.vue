<template>
  <div :class="dkli">
    <div v-if="blocage">
      <blocage-ico :niveau="blocage.niv" class="q-mr-xs"/>
      <span class="titre-sm q-my-sm text-negative text-bold bg-yellow-3">{{$t('SBn' + blocage.niv) + $t('SBdisp2', [blocage.njrb])}}</span>
      <q-btn v-if="edit && session.estComptable" color="primary" 
        class="q-ml-sm btn2" size="sm" dense icon="edit" @click="editerbl(true)"/>
      <q-btn v-else color="primary" 
        class="q-ml-sm btn2" size="sm" dense icon="open_in_new" :label="$t('detail')" @click="editerbl(edx !== 0)"/>
    </div>
    <div v-else>
      <div v-if="edit && (session.estComptable || session.estSponsor)">
        <span class="titre-sm q-my-sm text-italic">{{$t('SNnon')}}</span>
        <q-btn color="primary" class="q-ml-sm btn2" size="sm" :label="$t('NTcre')"
          dense icon="edit" @click="editerbl(true)"/>
      </div>
    </div>

    <q-dialog v-if="!naCo" v-model="edbl" persistent>
      <ed-blocage :bl-tr="bloc" :na-tr="naTr" :edit="edaff" :close="closebl"/>
    </q-dialog>

    <q-dialog v-if="naCo" v-model="edbl" persistent>
      <ed-blocage :bl-tr="blTr" :bl-co="bloc" :na-tr="naTr" :na-co="naCo"
        :edit="edaff" :close="closebl"/>
    </q-dialog>

  </div>
</template>
<script>

import stores from '../stores/stores.mjs'
import EdBlocage from './EdBlocage.vue'
import BlocageIco from './BlocageIco.vue'
import { Blocage } from '../app/modele.mjs'
import { afficherDiag } from '../app/util.mjs'
import { IDCOMPTABLE } from '../app/api.mjs'

export default {
  name: 'ApercuBlocage',

  props: { 
    blocage: Object, 
    naTr: Object, 
    idx: Number, 
    edit: Boolean, 
    naCo: Object, // Afficher un "double" blocage, tribu ET compte (compte est éditable)
    blTr: Object // Blocage tribu, soit éditable si !compte, soit pour double affichage si compte
  },

  components: { EdBlocage, BlocageIco },

  computed: {
    edx () { return this.session.estComptable || this.blocage.sp },
    dkli () { return this.$q.dark.isActive ? (this.idx ? 'sombre' + (this.idx % 2) : 'sombre0') : (this.idx ? 'clair' + (this.idx % 2) : 'clair0') },
  },

  data () { return {
    edbl: false,
    edaff: false,
  }},

  methods: {
    async editerbl (ed) {
      if (! await this.session.edit()) return
      if (this.naCo && this.naCo.id === IDCOMPTABLE) {
        afficherDiag($t('PTpasc'))
        return
      }
      const aut = this.session.estComptable ? 0 : this.session.compteId
      this.bloc = this.blocage ? this.blocage.clone() : new Blocage(null, aut)
      this.edbl = true
      this.edaff = ed
    },
    closebl () { this.edbl = false }
  },

  setup () {
    const session = stores.session
    return {
      session
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
</style>
