<template>
<div>
  <div class="titre-md text-italic">{{$t('AMardtit2')}}</div>
  <show-html class="bord" :texte="mb.ard || ''" zoom edit scroll maxh="3rem" @edit="editard"/>

  <!-- Edition de l'ardoise -->
  <q-dialog v-model="ardoise" persistent>
    <q-card class="bs moyennelargeur">
      <q-toolbar class="bg-secondary text-white">
        <q-btn dense size="md" color="warning" icon="close" @click="MD.fD"/>
        <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('AMardtit', [mb.na.nom])}}</q-toolbar-title>
        <bouton-help page="page1"/>
      </q-toolbar>
      <q-card-section>
        <!--
          titre: String,
          help: String,
          lgmax: Number, 
          modelValue: String, 
          texte: String,
          placeholder: String,
          labelOk: String, 
          editable: Boolean, 
          idx: Number, 
          modetxt: Boolean, 
          horsSession: Boolean,
          mh: String
      -->
        <editeur-md :lgmax="1000" v-model="ard" :texte="mb.ard || ''" modetxt mh="10rem"
          label-ok="OK" editable @ok="okard"/>
      </q-card-section>
    </q-card>
  </q-dialog>
</div>
</template>
<script>

import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import EditeurMd from './EditeurMd.vue'
import { MD } from '../app/modele.mjs'
import ShowHtml from './ShowHtml.vue'
import BoutonHelp from './BoutonHelp.vue'
import { ArdoiseMembre } from '../app/operations.mjs'

export default ({
  name: 'ArdoiseAdmin',

  components: { EditeurMd, ShowHtml, BoutonHelp },

  props: { mb: Object },

  computed: {
  },

  data () { return {
    ard: ''
  }},

  methods: {
    async editard () {
      if (!await this.session.edit()) return
      this.ovardoise()
      this.ard = this.mb.ard
    },
    async okard () {
      await new ArdoiseMembre().run(this.ard, this.mb.id, this.mb.ids)
      MD.fD()
    }
  },
  
  setup () {
    const session = stores.session
    const ardoise = ref(false)
    function ovardoise () { MD.oD(ardoise) }
    return {
      session, MD, ardoise, ovardoise
    }
  } 
})
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border: 1px solid $grey-5
  border-radius: 5px
  padding: 3px !important
</style>
