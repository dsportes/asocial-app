<template>
<q-dialog v-model="ui.d.ACVouvrir" persistent>
  <q-card :class="styp('sm') + 'column minh'">
    <q-toolbar class="col-auto bg-secondary text-white">
      <q-btn dense size="md" color="warning" icon="close" @click="ui.fD"/>
      <q-toolbar-title> 
        <!--span>{{estAvc}} - {{estGroupe}} - {{diag.substring(0, 4)}}</span-->
        <span class="titre-lg">{{estAvc ? na.nom : na.nomc}}</span> 
        <span v-if="estAvc" class="titre-md q-ml-md">[{{$t('moi')}}]</span>
      </q-toolbar-title>
      <q-btn v-if="!estGroupe && !estAvc && net" dense size="md" padding="none" round
        color="primary" icon="refresh" @click="refresh"/>
      <q-btn v-if="(estAvc || estGroupe) && diag === ''" dense size="md" 
        icon="edit" color="primary"
        :label="$t('editer')" @click="ovcved"/>
    </q-toolbar>
    <q-toolbar inset v-if="diag !== ''" class="bg-yellow-5 text-bold text-black titre-md">
      {{diag}}
    </q-toolbar>

    <div class="row q-pa-xs">
      <img class="col-auto q-mr-sm photomax" :src="photo" />
      <show-html v-if="info" class="col" zoom scroll maxh="15rem" :texte="info"/>
      <div v-else class="col text-italic">{{$t('FAnoinfo')}}</div>
    </div>

    <!-- Dialogue d'édition de la carte de visite -->
    <carte-visite v-model="ui.d.CVedition" @ok="cvok"
      :photo-init="photo" :info-init="info" :na="na"/>

  </q-card>
</q-dialog>
</template>

<script>
import stores from '../stores/stores.mjs'
import { ChargerCvs, MajCv, MajCvGr } from '../app/operations.mjs'
import { ID } from '../app/api.mjs'
import { styp } from '../app/util.mjs'

import ShowHtml from '../components/ShowHtml.vue'
import CarteVisite from '../dialogues/CarteVisite.vue'

export default {
  name: 'ApercuCv',

  props: {
  },

  components: { ShowHtml, CarteVisite },

  computed: {
    lidk () { return !this.$q.dark.isActive ? 'sombre0' : 'clair0' },

    estGroupe () { return ID.estGroupe(this.id) },
    estAvc () { return this.estGroupe ? false : this.aSt.compte.estAvDuCompte(this.id) },
    eg () { return this.estGroupe ? this.gSt.egr(this.id) : null },
    agp () { 
      if (this.estGroupe) return this.eg.groupe
      if (this.estAvc) return this.aSt.getAvatar(this.id)
      return this.pSt.getPeople(this.id)
    },
    estAnim () { 
      if (this.estGroupe) {
        const x = this.eg
        const a = x.estAnim
        return a
      } 
      return false 
    },
    na () { return this.agp.na },
    cv () { return this.agp.cv },
    diag () {
      if (this.session.editDiag) return this.session.editDiag
      if (!this.estGroupe) return ''
      const x = this.estAnim 
      if (!x) 
        return this.$t('FAcvgr') 
      else 
        return ''
    },

    photo () { return this.cv && this.cv.photo ? this.cv.photo : this.na.defIcon },
    info () { return this.cv ? (this.cv.info || '') : '' }
  },

  data () {
    return {
    }
  },

  methods: {
    ovcved () {
      this.ui.cveditionId = this.id
      this.ui.oD('CVedition')
    },

    async refresh () {
      const x = await new ChargerCvs().run(this.id)
      if (x) cv = x
    },

    async cvok (res) {
      if (res) {
        if (this.estGroupe) {
          await new MajCvGr().run(this.agp, res.ph, res.info)
        } else {
          await new MajCv().run(this.agp, res.ph, res.info)
        }
      }
    }

  },

  setup () {
    const session = stores.session
    const ui = stores.ui
    const aSt = stores.avatar
    const gSt = stores.groupe
    const pSt = stores.people
    const id = ui.cveditionId
    
    return {
      styp, session, ui, ID, aSt, gSt, pSt, id,
      net: session.accesNet
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.minh
  min-height:20rem
</style>
